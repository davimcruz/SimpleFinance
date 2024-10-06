import { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  try {
    const { cardId } = req.body

    if (!cardId) {
      return res.status(400).json({ error: "CardId é obrigatório." })
    }

    await prisma.faturas.deleteMany({
      where: {
        cardId: cardId,
      },
    })

    await prisma.parcelas.deleteMany({
      where: {
        cardId: cardId,
      },
    })

    await prisma.transacoes.deleteMany({
      where: {
        cardId: cardId,
      },
    })

    await prisma.cartoes.delete({
      where: {
        cardId: cardId,
      },
    })

    return res
      .status(200)
      .json({ message: "Cartão e dados relacionados excluídos com sucesso." })
  } catch (error) {
    console.error("Erro ao processar a exclusão:", error)
    return res.status(500).json({ error: "Erro ao processar a exclusão." })
  }
}
