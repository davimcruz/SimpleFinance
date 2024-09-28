import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../Auth/jwtAuth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ message: "Não autorizado" })
  }

  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({ message: "UserId não fornecido" })
  }

  const userIdNumber = Number(userId)
  if (isNaN(userIdNumber)) {
    return res.status(400).json({ message: "UserId inválido" })
  }

  try {
    const anoAtual = new Date().getFullYear()
    const mesAtual = new Date().getMonth() + 1

    const totalOrcamento = await prisma.orcamento.aggregate({
      _sum: {
        valor: true,
      },
      where: {
        userId: userIdNumber,
        ano: anoAtual,
        mes: {
          lte: mesAtual,
        },
      },
    })

    return res.status(200).json({
      message: "Orçamento acumulado até o mês atual obtido com sucesso",
      totalOrcamento: totalOrcamento._sum.valor || 0,
    })
  } catch (error) {
    console.error("Erro ao obter orçamento:", error)
    return res.status(500).json({
      message: "Erro ao obter orçamento",
      error: (error as Error).message,
    })
  }
}
