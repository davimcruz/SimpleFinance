import { NextApiRequest, NextApiResponse } from "next"
import { v4 as uuidv4 } from "uuid"
import { verifyToken } from "../auth/jwt-auth"
import Redis from "ioredis"
import prisma from "@/lib/prisma"

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
  console.log("Realocação de saldo concluída.")
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Recebendo requisição:", req.method, req.body)

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    console.log("Token inválido.")
    return res.status(401).json({ error: "Não autorizado" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { email, nome, tipo, fonte, detalhesFonte, data, valor, cardId } =
    req.body

  if (
    !email ||
    !nome ||
    !tipo ||
    !fonte ||
    !data ||
    valor === null ||
    valor === undefined
  ) {
    console.log("Dados obrigatórios estão faltando:", req.body)
    return res.status(400).json({ error: "Dados obrigatórios estão faltando" })
  }

  const valorFloat = parseFloat(valor)

  if (isNaN(valorFloat)) {
    console.log("Valor inválido:", valor)
    return res.status(400).json({ error: "Valor inválido" })
  }

  console.log("Email recebido:", email)

  try {
    console.log("Buscando ID do usuário no banco...")
    const user = await prisma.usuarios.findUnique({
      where: { email },
    })

    if (!user) {
      console.log("Usuário não encontrado")
      return res.status(404).json({ error: "Usuário não encontrado" })
    }

    const transactionId = uuidv4()

    const extractedDate = data.split("T")[0]
    const formattedDate = extractedDate.split("-").reverse().join("-")

    console.log("Salvando transação no banco de dados...")

    const createTransactionPromise = prisma.transacoes.create({
      data: {
        transactionId,
        nome,
        tipo,
        fonte,
        detalhesFonte: detalhesFonte || null,
        data: formattedDate || null,
        valor: valorFloat,
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

    console.log("Transação salva com sucesso.")

    const cacheKey = `transactions:user:${user.id}`
    await redis.del(cacheKey)

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
