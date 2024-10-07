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
  console.log("Recebendo requisição:", req.method, req.body)

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ error: "Não autorizado" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { transactionId } = req.body

  if (!transactionId || typeof transactionId !== "string") {
    return res.status(400).json({ error: "Transaction ID inválido" })
  }

  console.log("Transaction ID recebido:", transactionId)

  try {
    const currentTransaction = await prisma.transacoes.findUnique({
      where: { transactionId },
    })

    if (!currentTransaction) {
      return res.status(404).json({ error: "Transação não encontrada" })
    }

    const userId = currentTransaction.userId

    const parcelas = await prisma.parcelas.findMany({
      where: { transacaoId: transactionId },
    })

    const faturasToCheck = new Set(parcelas.map((parcela) => parcela.faturaId))

    await prisma.parcelas.deleteMany({
      where: { transacaoId: transactionId },
    })

    console.log("Parcelas deletadas para a transação:", transactionId)

    for (const faturaId of faturasToCheck) {
      if (!faturaId) continue

      const outrasParcelas = await prisma.parcelas.findMany({
        where: { faturaId },
      })

      if (outrasParcelas.length === 0) {
        await prisma.faturas.delete({
          where: { faturaId },
        })
        console.log("Fatura excluída:", faturaId)
      } else {
        const novoValorTotal = outrasParcelas.reduce(
          (total, parcela) => total + parcela.valorParcela,
          0
        )
        await prisma.faturas.update({
          where: { faturaId },
          data: { valorTotal: novoValorTotal },
        })
        console.log("Fatura atualizada:", faturaId)
      }
    }

    await prisma.transacoes.delete({
      where: { transactionId },
    })

    console.log("Transação deletada com sucesso:", transactionId)

    const cacheKey = `transactions:user:${userId}`
    await redis.del(cacheKey)
    console.log("Cache de transações invalidado para o usuário:", userId)

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar a transação:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
