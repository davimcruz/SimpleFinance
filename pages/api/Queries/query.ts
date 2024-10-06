import { NextApiRequest, NextApiResponse } from "next"
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: "User ID é obrigatório." })
    }

    const userIdNumber = Number(userId)
    if (isNaN(userIdNumber)) {
      return res.status(400).json({ error: "ID de usuário inválido." })
    }

    const cacheKey = `user:${userIdNumber}`
    const cachedUser = await redis.get(cacheKey)

    if (cachedUser) {
      return res.status(200).json(JSON.parse(cachedUser))
    }

    const user = await prisma.usuarios.findUnique({
      where: { id: userIdNumber },
      select: { id: true, nome: true, sobrenome: true, image: true },
    })

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" })
    }

    await redis.set(cacheKey, JSON.stringify(user), "EX", 60 * 60) 
    return res.status(200).json(user)
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição." })
  }
}
