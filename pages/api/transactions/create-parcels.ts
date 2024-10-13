import { NextApiRequest, NextApiResponse } from "next"
import { v4 as uuidv4 } from "uuid"
import { verifyToken } from "../middleware/jwt-auth"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import Redis from "ioredis"
import { createParcelsSchema, CreateParcelsInput } from "@/lib/validation"
import { parse, format } from "date-fns"

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
  console.log("Iniciando realocacao de saldo...")

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

  const updates: Prisma.PrismaPromise<any>[] = orcamentos.map((mesAtual) => {
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
  console.log("Realocacao de saldo concluida.")
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Recebendo requisicao:", req.method, req.body)

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ error: "Nao autorizado" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido" })
  }

  const parseResult = createParcelsSchema.safeParse(req.body)

  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {}
    parseResult.error.errors.forEach((err) => {
      const fieldName = err.path[0] as string
      fieldErrors[fieldName] = err.message
    })
    console.log("Erros de validação:", fieldErrors)
    return res
      .status(400)
      .json({ error: "Dados inválidos", details: fieldErrors })
  }

  const {
    email,
    nome,
    tipo,
    fonte,
    detalhesFonte,
    data,
    valor,
    cardId,
    numeroParcelas,
  } = parseResult.data

  try {
    console.log("Buscando ID do usuario no banco...")
    const user = await prisma.usuarios.findUnique({
      where: { email },
    })

    if (!user) {
      console.log("Usuario nao encontrado")
      return res.status(404).json({ error: "Usuario nao encontrado" })
    }

    const cartao = await prisma.cartoes.findUnique({
      where: { cardId },
      select: {
        vencimento: true,
      },
    })

    if (!cartao) {
      console.log("Cartao nao encontrado.")
      return res.status(404).json({ error: "Cartao nao encontrado." })
    }

    const grupoParcelamentoId = uuidv4()

    let formattedDate: string

    if (/^\d{2}-\d{2}-\d{4}$/.test(data)) {
      const parsedDate = parse(data, "dd-MM-yyyy", new Date())
      formattedDate = format(parsedDate, "dd-MM-yyyy")
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(data)) {
      const parsedDate = new Date(data)
      formattedDate = format(parsedDate, "dd-MM-yyyy")
    } else {
      console.log("Formato de data invalido:", data)
      return res.status(400).json({ error: "Formato de data invalido" })
    }

    const valorParcela = valor / numeroParcelas
    const dataTransacao = parse(formattedDate, "dd-MM-yyyy", new Date())
    const mesInicial = dataTransacao.getMonth() + 1
    const anoInicial = dataTransacao.getFullYear()
    const hoje = new Date()

    let mesParcelaInicial = mesInicial
    let anoParcelaInicial = anoInicial

    if (
      hoje.getMonth() + 1 === mesInicial &&
      hoje.getDate() > (cartao.vencimento as number)
    ) {
      mesParcelaInicial = (mesInicial % 12) + 1
      anoParcelaInicial = mesInicial === 12 ? anoInicial + 1 : anoInicial
    }

    const parcelasCriadas: Prisma.PrismaPromise<any>[] = []
    const faturasCriadas: Prisma.PrismaPromise<any>[] = []

    for (let i = 0; i < numeroParcelas; i++) {
      const mesParcela = ((mesParcelaInicial + i - 1) % 12) + 1
      const anoParcela =
        mesParcelaInicial + i > 12 ? anoParcelaInicial + 1 : anoParcelaInicial

      const parcelaTransactionId = uuidv4()

      const dataParcela =
        i === 0
          ? formattedDate
          : format(
              new Date(anoParcela, mesParcela - 1, cartao.vencimento as number),
              "dd-MM-yyyy"
            )

      const transacaoCriada = prisma.transacoes.create({
        data: {
          transactionId: parcelaTransactionId,
          grupoParcelamentoId,
          nome: `${nome} (${i + 1}° Parcela)`,
          tipo,
          fonte,
          detalhesFonte: detalhesFonte || null,
          data: dataParcela,
          valor: valorParcela,
          numeroParcelas: 1,
          usuarios: {
            connect: { id: user.id },
          },
          cartoes: { connect: { cardId } },
        },
      })

      parcelasCriadas.push(transacaoCriada)

      let fatura = await prisma.faturas.findFirst({
        where: {
          cardId,
          mes: mesParcela,
          ano: anoParcela,
        },
      })

      if (fatura && fatura.pago) {
        const vencimento = new Date(
          anoParcela,
          mesParcela - 1,
          cartao.vencimento as number
        )
        fatura = await prisma.faturas.create({
          data: {
            cardId,
            mes: mesParcela,
            ano: anoParcela,
            valorTotal: 0,
            vencimento,
          },
        })
      } else if (!fatura) {
        const vencimento = new Date(
          anoParcela,
          mesParcela - 1,
          cartao.vencimento as number
        )
        fatura = await prisma.faturas.create({
          data: {
            cardId,
            mes: mesParcela,
            ano: anoParcela,
            valorTotal: 0,
            vencimento,
          },
        })
      }

      const parcelaCriada = prisma.parcelas.create({
        data: {
          transacaoId: parcelaTransactionId,
          cardId,
          faturaId: fatura.faturaId,
          valorParcela,
          mes: mesParcela,
          ano: anoParcela,
          pago: false,
        },
      })

      faturasCriadas.push(
        prisma.faturas.update({
          where: { faturaId: fatura.faturaId },
          data: {
            valorTotal: {
              increment: valorParcela,
            },
          },
        })
      )

      parcelasCriadas.push(parcelaCriada)
    }

    await prisma.$transaction([...parcelasCriadas, ...faturasCriadas])

    realocarSaldo(user.id, new Date().getFullYear()).catch((err) =>
      console.error("Erro ao realocar saldo:", err)
    )

    const cacheKey = `transactions:user:${user.id}`
    await redis.del(cacheKey)
    console.log("Cache de transações invalidado para o usuário:", user.id)

    res.status(200).json({ success: true, grupoParcelamentoId })
  } catch (error) {
    console.error("Erro ao processar a requisicao:", error)
    return res.status(500).json({ error: "Erro ao processar a requisicao" })
  }
}