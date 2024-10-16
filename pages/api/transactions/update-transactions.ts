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

//realocarSaldo AQUI

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

  const { transactionId, ...updateFields } = req.body

  if (!transactionId) {
    return res.status(400).json({ error: "transactionId é obrigatório" })
  }

  try {
    const currentTransaction = await prisma.transacoes.findUnique({
      where: { transactionId },
      include: {
        parcelas: true,
      },
    })

    if (!currentTransaction) {
      return res.status(404).json({ error: "Transação não encontrada" })
    }

    const updates: any = {}

    if ('nome' in updateFields) {
      updates.nome = updateFields.nome
    }
    if ('tipo' in updateFields) {
      updates.tipo = updateFields.tipo
    }
    if ('fonte' in updateFields) {
      updates.fonte = updateFields.fonte
    }
    if ('detalhesFonte' in updateFields) {
      updates.detalhesFonte = updateFields.detalhesFonte || null
    }
    if ('data' in updateFields) {
      updates.data = updateFields.data;
    }
    if ('valor' in updateFields) {
      const valorFloat = typeof updateFields.valor === "number" ? updateFields.valor : parseFloat(updateFields.valor)
      updates.valor = valorFloat

      if (currentTransaction.numeroParcelas) {
        const valorParcelaNovo = valorFloat / currentTransaction.numeroParcelas

        await prisma.parcelas.updateMany({
          where: { transacaoId: transactionId },
          data: {
            valorParcela: valorParcelaNovo,
          },
        })

        const faturaIds = currentTransaction.parcelas
          .map((parcela) => parcela.faturaId)
          .filter((id): id is string => id !== null)

        const faturasAtualizadas = await prisma.faturas.findMany({
          where: { faturaId: { in: faturaIds } },
        })

        for (const fatura of faturasAtualizadas) {
          const totalParcelas = await prisma.parcelas.findMany({
            where: { faturaId: fatura.faturaId },
          })

          const novoValorTotal = totalParcelas.reduce(
            (acc, parcela) => acc + parcela.valorParcela,
            0
          )

          await prisma.faturas.update({
            where: { faturaId: fatura.faturaId },
            data: { valorTotal: novoValorTotal },
          })
        }
      }
    }
    if ('cardId' in updateFields) {
      const cartao = await prisma.cartoes.findUnique({
        where: { cardId: updateFields.cardId },
      })
      if (!cartao) {
        return res.status(400).json({ error: "Cartão não encontrado" })
      }
      updates.cardId = updateFields.cardId
    }

    if (Object.keys(updates).length === 0) {
      return res.status(200).json({ message: "Nenhuma alteração detectada" })
    }

    const updatedTransaction = await prisma.transacoes.update({
      where: { transactionId },
      data: updates,
    })

    console.log("Transação atualizada com sucesso:", updatedTransaction)

    const cacheKey = `transactions:user:${updatedTransaction.userId}`
    await redis.del(cacheKey)

    {/*realocarSaldo(updatedTransaction.userId, new Date().getFullYear()).catch(
      (err) => console.error("Erro ao realocar saldo:", err)
    )*/}

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
