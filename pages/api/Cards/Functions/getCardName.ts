import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "../../Auth/jwtAuth"
import Redis from "ioredis"
import prisma from "@/lib/prisma"

const redisUrl = process.env.REDIS_URL
const redisToken = process.env.REDIS_TOKEN

if (!redisUrl || !redisToken) {
  throw new Error(
    "Variáveis de Ambiente não definidas"
  )
}

const redis = new Redis(redisUrl, {
  password: redisToken,
  maxRetriesPerRequest: 10,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  try {
    const tokenValid = await verifyToken({ req } as any)
    if (!tokenValid) {
      console.log("Token inválido.")
      return res.status(401).json({ error: "Não autorizado" })
    }

    const { cardId } = req.body

    if (!cardId) {
      return res.status(400).json({ error: "CardId é obrigatório." })
    }

    const cachedCardName = await redis.get(`cardName:${cardId}`)
    if (cachedCardName) {
      return res.status(200).json({
        message: "Nome do cartão recuperado do cache com sucesso.",
        nomeCartao: cachedCardName,
      })
    }

    const cardDetails = await prisma.cartoes.findUnique({
      where: {
        cardId: cardId,
      },
      select: {
        nomeCartao: true, 
      },
    })

    if (!cardDetails) {
      return res
        .status(404)
        .json({ error: "Nenhum cartão encontrado com o cardId fornecido." })
    }

    await redis.set(
      `cardName:${cardId}`,
      cardDetails.nomeCartao,
      "EX",
      60 * 60 * 24
    )

    return res.status(200).json({
      message: "Nome do cartão recuperado com sucesso.",
      nomeCartao: cardDetails.nomeCartao,
    })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição." })
  }
}
