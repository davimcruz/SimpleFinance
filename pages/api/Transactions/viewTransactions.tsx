import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function editTransactions(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { transactionId } = req.body

  if (!transactionId) {
    return res
      .status(400)
      .json({ error: "transactionId é necessário no corpo da requisição" })
  }

  try {
    const transaction = await prisma.transacoes.findUnique({
      where: {
        transactionId: transactionId,
      },
    })

    if (!transaction) {
      console.log("Transação não encontrada para o ID:", transactionId)
      return res.status(404).json({ error: "Transação não encontrada" })
    }

    res.status(200).json(transaction)
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    res.status(500).json({ error: "Erro ao processar a requisição" })
  } finally {
    await prisma.$disconnect()
  }
}
