import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "@/pages/api/middleware/jwt-auth"
import prisma from "@/lib/prisma"
import { createCardSchema } from "@/lib/validation"
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      console.log("Método não permitido")
      return res.status(405).json({ message: "Método não permitido" })
    }

    const tokenValid = await verifyToken({ req } as any)
    console.log("Token verificado:", tokenValid)

    if (!tokenValid) {
      console.log("Token inválido ou não autorizado.")
      return res.status(401).json({ message: "Não autorizado" })
    }

    const parsedBody = createCardSchema.safeParse(req.body)

    if (!parsedBody.success) {
      console.log("Erro de validação:", parsedBody.error.flatten().fieldErrors)
      return res.status(400).json({
        message: "Dados inválidos",
        errors: parsedBody.error.flatten().fieldErrors,
      })
    }

    const { userId, nome, bandeira, instituicao, tipo, vencimento, limite } = parsedBody.data

    console.log("Dados validados com sucesso:", {
      userId,
      nome,
      bandeira,
      instituicao,
      tipo,
      vencimento,
      limite,
    })

    const cartoesExistentes = await prisma.cartoes.count({
      where: {
        userId: userId,
        tipoCartao: tipo,
      },
    })

    if (cartoesExistentes >= 3) {
      console.log(`Usuário já possui 3 cartões do tipo ${tipo}`)
      return res
        .status(400)
        .json({ message: `Você já possui 3 cartões do tipo ${tipo}` })
    }

    const novoCartao = await prisma.cartoes.create({
      data: {
        userId: userId,
        nomeCartao: nome,
        bandeira: bandeira,
        instituicao: instituicao,
        tipoCartao: tipo,
        vencimento: vencimento,
        limite: limite,
      },
    })

    console.log("Cartão criado com sucesso:", novoCartao)

    const cacheKey = `userCards:${userId}`
    await redis.del(cacheKey)
    console.log(`Cache invalidado para a chave: ${cacheKey}`)

    return res
      .status(201)
      .json({ message: "Cartão criado com sucesso", cartao: novoCartao })
  } catch (error: any) {
    console.error("Erro ao criar cartão:", error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Dados inválidos",
        errors: error.errors,
      })
    }

    if (error.code === "P2002") {
      console.log("Erro de duplicidade: Cartão já existe")
      return res.status(409).json({ message: "Conflito: Cartão já existe" })
    }

    return res.status(500).json({
      message: "Erro ao criar cartão",
      error: error?.message || "Erro desconhecido",
    })
  }
}
