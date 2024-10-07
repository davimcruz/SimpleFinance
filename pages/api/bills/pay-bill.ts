import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../middleware/jwt-auth"
import prisma from "@/lib/prisma"
import Redis from "ioredis"

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(
    "Recebendo requisicao para pagamento de fatura:",
    req.method,
    req.body
  )

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ error: "Não autorizado" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo não permitido" })
  }

  const { faturaId } = req.body

  if (!faturaId) {
    console.log("FaturaId obrigatorio nao foi fornecido.")
    return res
      .status(400)
      .json({ error: "FaturaId obrigatorio nao foi fornecido." })
  }

  try {
    const fatura = await prisma.faturas.findUnique({
      where: { faturaId },
    })

    if (!fatura) {
      console.log("Fatura nao encontrada.")
      return res.status(404).json({ error: "Fatura nao encontrada." })
    }

    const transacoesAssociadas = await prisma.transacoes.findMany({
      where: {
        parcelas: {
          some: {
            faturaId,
          },
        },
      },
      include: {
        parcelas: true,
      },
    })

    if (!transacoesAssociadas || transacoesAssociadas.length === 0) {
      return res
        .status(404)
        .json({ error: "Nenhuma transação associada à fatura." })
    }

    const userId = transacoesAssociadas[0].userId

    await prisma.$transaction([
      prisma.faturas.update({
        where: { faturaId },
        data: { pago: true },
      }),
      prisma.parcelas.updateMany({
        where: { faturaId },
        data: { pago: true },
      }),
      prisma.transacoes.updateMany({
        where: {
          parcelas: {
            some: {
              faturaId,
            },
          },
        },
        data: { tipo: "pago" },
      }),
    ])

    console.log("Pagamento realizado com sucesso.")

    const cacheKey = `transactions:user:${userId}`
    await redis.del(cacheKey)
    console.log("Cache de transações invalidado para o usuário:", userId)

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Erro ao processar pagamento da fatura:", error)
    return res
      .status(500)
      .json({ error: "Erro ao processar pagamento da fatura." })
  }
}
