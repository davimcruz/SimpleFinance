import { NextApiRequest, NextApiResponse } from "next"

import { verifyToken } from "../middleware/jwt-auth"

import prisma from "@/lib/prisma"

export default async function viewTransactions(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ error: "Não autorizado" })
  }

  const { transactionId } = req.body

  if (!transactionId) {
    return res
      .status(400)
      .json({ error: "transactionId é necessário no corpo da requisição" })
  }

  try {
    const transaction = await prisma.transacoes.findUnique({
      where: { transactionId },
      include: {
        cartoes: true,
        parcelas: true,
      },
    })

    if (!transaction) {
      return res.status(404).json({ error: "Transação não encontrada" })
    }

    const transactionData = {
      ...transaction,
      valor: parseFloat(transaction.valor as unknown as string),
      parcelas: transaction.parcelas.length > 0 ? transaction.parcelas : null,
      cartao: transaction.cartoes || null,
    }

    res.status(200).json(transactionData)
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
