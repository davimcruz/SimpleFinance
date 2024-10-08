import { NextApiRequest, NextApiResponse } from "next"
import { v4 as uuidv4 } from "uuid"
import { verifyToken } from "../middleware/jwt-auth"
import Redis from "ioredis"
import prisma from "@/lib/prisma"
import { z } from "zod"

const transactionSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  nome: z.string().min(1, { message: "Nome é obrigatório" }),
  tipo: z.enum(["receita", "despesa"], {
    message: "Tipo deve ser 'receita' ou 'despesa'",
  }),
  fonte: z.string().min(1, { message: "Fonte é obrigatória" }),
  detalhesFonte: z.string().optional(),
  data: z.string().refine(
    (date) => {
      const ddMMyyyy = /^\d{2}-\d{2}-\d{4}$/.test(date)
      const isoFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(
        date
      )
      return ddMMyyyy || isoFormat
    },
    {
      message:
        "Data deve estar no formato DD-MM-YYYY ou ISO (yyyy-mm-ddTHH:MM:SS.sssZ)",
    }
  ),
  valor: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().positive({ message: "Valor deve ser um número positivo" })
  ),
  cardId: z
    .string()
    .uuid({ message: "cardId deve ser um UUID válido" })
    .optional(),
})

const redisUrl = process.env.REDIS_URL
const redisToken = process.env.REDIS_TOKEN

if (!redisUrl || !redisToken) {
  throw new Error(
    "Variáveis de Ambiente REDIS_URL e REDIS_TOKEN não estão definidas."
  )
}

const redis = new Redis(redisUrl, {
  password: redisToken,
  maxRetriesPerRequest: 5,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000)
    return delay
  },
  reconnectOnError: (err) => {
    const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"]
    if (targetErrors.some((targetError) => err.message.includes(targetError))) {
      return true
    }
    return false
  },
})

const realocarSaldo = async (userId: number, anoAtual: number) => {
  const orcamentos = await prisma.orcamento.findMany({
    where: { userId, ano: anoAtual },
    orderBy: { mes: "asc" },
  })

  const transacoes = await prisma.transacoes.findMany({
    where: {
      userId,
      data: {
        contains: `-${anoAtual}`,
      },
    },
  })

  const transacoesPorMes = transacoes.reduce((acc, transacao) => {
    const mes = parseInt(transacao.data?.split("-")[1] || "0", 10)
    const valor = parseFloat(
      String(transacao.valor)?.replace("R$", "").replace(",", ".").trim() || "0"
    )

    if (!acc[mes]) {
      acc[mes] = { receita: 0, despesa: 0 }
    }

    if (transacao.tipo === "receita") {
      acc[mes].receita += valor
    } else if (transacao.tipo === "despesa") {
      acc[mes].despesa += valor
    }

    return acc
  }, {} as Record<number, { receita: number; despesa: number }>)

  let saldoRealocadoAnterior = 0
  const mesAtualNumero = new Date().getMonth() + 1

  const updates = orcamentos.map((mesAtual) => {
    const transacoesMes = transacoesPorMes[mesAtual.mes] || {
      receita: 0,
      despesa: 0,
    }
    const saldoMes = transacoesMes.receita - transacoesMes.despesa

    let statusMes = "padrao"

    if (mesAtual.mes > mesAtualNumero) {
      statusMes = "futuro"
    } else {
      if (saldoMes > 0) statusMes = "excedente"
      else if (saldoMes < 0) statusMes = "deficit"
      else statusMes = "padrao"
    }

    let saldoRealocado = saldoRealocadoAnterior

    saldoRealocado += saldoMes
    saldoRealocadoAnterior = saldoRealocado

    return prisma.orcamento.update({
      where: {
        userId_mes_ano: {
          userId: mesAtual.userId,
          mes: mesAtual.mes,
          ano: mesAtual.ano,
        },
      },
      data: {
        saldoRealocado: saldoRealocado,
        status: statusMes,
      },
    })
  })

  await prisma.$transaction(updates)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ error: "Não autorizado" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const parseResult = transactionSchema.safeParse(req.body)

  if (!parseResult.success) {
    const { errors } = parseResult.error
    const errorMessages = errors.map((err) => err.message).join(", ")
    return res.status(400).json({ error: errorMessages })
  }

  const { email, nome, tipo, fonte, detalhesFonte, data, valor, cardId } =
    parseResult.data

  try {
    const user = await prisma.usuarios.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" })
    }

    const transactionId = uuidv4()

    let formattedDate = data
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(data)
    if (isoRegex) {
      const dateObj = new Date(data)
      const day = String(dateObj.getUTCDate()).padStart(2, "0")
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0")
      const year = dateObj.getUTCFullYear()
      formattedDate = `${day}-${month}-${year}`
    }

    const createTransactionPromise = prisma.transacoes.create({
      data: {
        transactionId,
        nome,
        tipo,
        fonte,
        detalhesFonte: detalhesFonte || null,
        data: formattedDate || null,
        valor: valor,
        usuarios: {
          connect: { id: user.id },
        },
        cartoes: cardId ? { connect: { cardId } } : undefined,
      },
    })

    const realocarSaldoPromise = realocarSaldo(
      user.id,
      new Date().getFullYear()
    )

    await Promise.all([createTransactionPromise, realocarSaldoPromise])

    const cacheKey = `transactions:user:${user.id}`
    await redis.del(cacheKey)

    res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
