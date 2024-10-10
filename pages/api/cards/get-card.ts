import { NextApiRequest, NextApiResponse } from "next"

import { verifyToken } from "@/pages/api/middleware/jwt-auth"

import prisma from "@/lib/prisma"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ message: "Método não permitido" })
    }

    const tokenValid = await verifyToken({ req } as any)
    if (!tokenValid) {
      return res.status(401).json({ message: "Não autorizado" })
    }

    const { userId } = req.query

    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({ message: "Parâmetro userId inválido" })
    }

    const cartoes = await prisma.cartoes.findMany({
      where: {
        userId: Number(userId),
        tipoCartao: "credito",
      },
      select: {
        cardId: true,
        nomeCartao: true,
        bandeira: true,
        instituicao: true,
        tipoCartao: true,
        vencimento: true,
        limite: true,
      },
    })

    if (cartoes.length === 0) {
      return res
        .status(201)
        .json({ message: "Nenhum cartão de crédito encontrado" })
    }

    return res.status(200).json({ cartoes })
  } catch (error: any) {
    console.error("Erro ao buscar cartões:", error)

    return res.status(500).json({
      message: "Erro ao buscar cartões",
      error: error?.message || "Erro desconhecido",
    })
  }
}
