import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function deleteUsersTransactions(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { ids } = req.body

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({
      error: "É necessário enviar um array de IDs no corpo da requisição.",
    })
  }

  try {
    const deleteTransactions = await prisma.transacoes.deleteMany({
      where: {
        userId: {
          in: ids,
        },
      },
    })

    res.status(200).json({
      message: "Transações excluídas com sucesso.",
      deletedCount: deleteTransactions.count,
    })
  } catch (error) {
    console.error("Erro ao excluir transações:", error)
    res.status(500).json({ error: "Erro ao excluir transações." })
  } finally {
    await prisma.$disconnect()
  }
}
