import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "@/pages/api/middleware/jwt-auth"
import prisma from "@/lib/prisma"
import Redis from "ioredis"
import { z } from "zod"

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

const deleteCardSchema = z.object({
  cardId: z.string().uuid(),
  userId: z.number().positive(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "DELETE") {
      console.log("Método não permitido")
      return res.status(405).json({ message: "Método não permitido" })
    }

    const tokenValid = await verifyToken({ req } as any)
    console.log("Token verificado:", tokenValid)

    if (!tokenValid) {
      console.log("Token inválido ou não autorizado.")
      return res.status(401).json({ message: "Não autorizado" })
    }

    const parsedBody = deleteCardSchema.safeParse(req.body)

    if (!parsedBody.success) {
      console.log("Erro de validação:", parsedBody.error.flatten().fieldErrors)
      return res.status(400).json({
        message: "Dados inválidos",
        errors: parsedBody.error.flatten().fieldErrors,
      })
    }

    const { cardId, userId } = parsedBody.data

    const deletedCard = await prisma.cartoes.delete({
      where: {
        cardId: cardId,
        userId: userId,
      },
    })

    if (!deletedCard) {
      return res.status(404).json({ message: "Cartão não encontrado" })
    }

    console.log("Cartão excluído com sucesso:", deletedCard)

    const cacheKey = `userCards:${userId}`
    await redis.del(cacheKey)
    console.log(`Cache invalidado para a chave: ${cacheKey}`)

    const cardNameCacheKey = `cardName:${cardId}`
    await redis.del(cardNameCacheKey)
    console.log(`Cache invalidado para a chave: ${cardNameCacheKey}`)

    return res.status(200).json({ message: "Cartão excluído com sucesso" })
  } catch (error: any) {
    console.error("Erro ao excluir cartão:", error)

    if (error.code === "P2025") {
      return res.status(404).json({ message: "Cartão não encontrado" })
    }

    return res.status(500).json({
      message: "Erro ao excluir cartão",
      error: error?.message || "Erro desconhecido",
    })
  }
}
