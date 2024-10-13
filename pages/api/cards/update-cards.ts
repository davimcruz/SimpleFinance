import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../middleware/jwt-auth"
import prisma from "@/lib/prisma"
import Redis from "ioredis"
import { updateCardSchema } from "@/lib/validation"
import { z } from "zod"

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
  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ error: "Não autorizado" })
  }

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  try {
    const validatedData = updateCardSchema.parse(req.body)
    const { cardId, nome, vencimento, ...updateFields } = validatedData

    const currentCard = await prisma.cartoes.findUnique({
      where: { cardId },
    })

    if (!currentCard) {
      return res.status(404).json({ error: "Cartão não encontrado" })
    }

    if (
      Object.keys(updateFields).length === 0 &&
      nome === currentCard.nomeCartao &&
      vencimento === currentCard.vencimento
    ) {
      return res.status(200).json({ message: "Nenhuma alteração detectada" })
    }

    const updatedCard = await prisma.cartoes.update({
      where: { cardId },
      data: {
        nomeCartao: nome,
        vencimento,
        ...updateFields,
      },
    })

    if (vencimento !== currentCard.vencimento) {
      await prisma.$executeRaw`
        UPDATE faturas
        SET vencimento = DATE_ADD(vencimento, 
          INTERVAL (${vencimento} - DAY(vencimento)) DAY)
        WHERE cardId = ${cardId}
          AND vencimento >= CURDATE()
      `

      await prisma.$executeRaw`
        UPDATE transacoes t
        JOIN faturas f ON t.cardId = f.cardId 
          AND EXTRACT(YEAR_MONTH FROM STR_TO_DATE(t.data, '%d-%m-%Y')) = EXTRACT(YEAR_MONTH FROM f.vencimento)
        SET t.data = DATE_FORMAT(f.vencimento, '%d-%m-%Y')
        WHERE t.cardId = ${cardId}
          AND f.vencimento >= CURDATE()
      `

      await prisma.$executeRaw`
        UPDATE parcelas p
        JOIN faturas f ON p.cardId = f.cardId AND p.faturaId = f.faturaId
        SET p.mes = MONTH(f.vencimento),
            p.ano = YEAR(f.vencimento)
        WHERE p.cardId = ${cardId}
          AND f.vencimento >= CURDATE()
      `
    }

    const cacheKey = `userCards:${updatedCard.userId}`
    await redis.del(cacheKey)

    res.status(200).json({ success: true, card: updatedCard })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Dados inválidos", details: error.errors })
    }
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
