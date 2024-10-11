import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "@/pages/api/middleware/jwt-auth"
import prisma from "@/lib/prisma"
import Redis from "ioredis"

const redisUrl = process.env.REDIS_URL
const redisToken = process.env.REDIS_TOKEN

if (!redisUrl || !redisToken) {
  throw new Error("Variáveis de Ambiente não definidas")
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
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ message: "Método não permitido" })
    }

    const tokenValid = await verifyToken({ req } as any)
    if (!tokenValid) {
      return res.status(401).json({ message: "Não autorizado" })
    }

    const { userId } = req.query

    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({ message: "Parâmetro userId inválido" })
    }

    const cacheKey = `userCards:${userId}`
    const cachedCards = await redis.get(cacheKey)

    if (cachedCards) {
      return res.status(200).json({ 
        message: "Cartões recuperados do cache com sucesso.",
        cartoes: JSON.parse(cachedCards) 
      })
    }

    const cartoes = await prisma.cartoes.findMany({
      where: {
        userId: Number(userId),
        tipoCartao: "credito",
      },
      select: {
        cardId: true,
        nomeCartao: true,
        bandeira: true,
        instituicao: true,
        tipoCartao: true,
        vencimento: true,
        limite: true,
      },
    })

    if (cartoes.length === 0) {
      return res
        .status(201)
        .json({ message: "Nenhum cartão de crédito encontrado" })
    }

    await redis.set(cacheKey, JSON.stringify(cartoes), "EX", 60 * 60 * 24)

    return res.status(200).json({ 
      message: "Cartões recuperados com sucesso.",
      cartoes 
    })
  } catch (error: any) {
    console.error("Erro ao buscar cartões:", error)

    return res.status(500).json({
      message: "Erro ao buscar cartões",
      error: error?.message || "Erro desconhecido",
    })
  }
}
