import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "../auth/middleware-jwt-auth"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  try {
    const tokenValid = await verifyToken({ req } as any)
    if (!tokenValid) {
      console.log("Token inválido.")
      return res.status(401).json({ error: "Não autorizado" })
    }

    const { cardId } = req.body

    if (!cardId) {
      return res.status(400).json({ error: "CardId é obrigatório." })
    }

    const cardDetails = await prisma.cartoes.findUnique({
      where: {
        cardId: cardId,
      },
      include: {
        transacoes: true,
        parcelas: true,
        faturas: true,
      },
    })

    if (!cardDetails) {
      return res
        .status(404)
        .json({ error: "Nenhum cartão encontrado com o cardId fornecido." })
    }

    return res.status(200).json({
      message: "Informações do cartão recuperadas com sucesso.",
      cardDetails: cardDetails,
    })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição." })
  }
}
