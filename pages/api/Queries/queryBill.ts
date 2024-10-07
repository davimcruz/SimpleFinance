import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../auth/middleware-jwt-auth"
import prisma from "@/lib/prisma"

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

    const faturas = await prisma.faturas.findMany({
      where: {
        cardId: cardId,
        pago: false,
      },
      include: {
        parcelas: true,
      },
      orderBy: [{ ano: "asc" }, { vencimento: "asc" }],
    })

    if (faturas.length === 0) {
      return res.status(404).json({
        error: "Nenhuma fatura em aberto encontrada para o cardId fornecido.",
      })
    }

    return res.status(200).json({
      message: "Faturas e parcelas em aberto recuperadas com sucesso.",
      faturas: faturas,
    })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição." })
  }
}
