import { NextApiRequest, NextApiResponse } from "next"
import { v4 as uuidv4 } from "uuid"
import { verifyToken } from "../middleware/jwt-auth"
import Redis from "ioredis"
import prisma from "@/lib/prisma"
import { createTransactionSchema } from "@/lib/validation"
import { invalidateSummaryCache } from "@/lib/invalidateSummaryCache"
import { atualizarFluxoReal } from "@/utils/cashflow/flowReal"
import { compararFluxos } from "@/utils/cashflow/flowComparisons"

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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const parseResult = createTransactionSchema.safeParse(req.body)

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

    await createTransactionPromise

    const invalidateCaches = async () => {
      const cacheKey = `transactions:user:${user.id}`
      await Promise.all([
        redis.del(cacheKey), 
        invalidateSummaryCache(user.id),
        atualizarFluxoReal(user.id).then(() => compararFluxos(user.id))
      ])
    }

    invalidateCaches().catch((err) =>
      console.error("Erro ao invalidar caches, atualizar fluxo real e fazer comparações:", err)
    )

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
