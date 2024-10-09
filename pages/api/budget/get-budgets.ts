import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../middleware/jwt-auth"
import prisma from "@/lib/prisma"
import { monthNames } from "@/utils/monthNames"

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

    const orcamentosAnuais = await prisma.orcamento.findMany({
      where: {
        userId: userIdNumber,
        ano: anoAtual,
      },
      select: {
        mes: true,
        valor: true,
      },
      orderBy: {
        mes: "asc",
      },
    })

    const orcamentosMensais = Array(12).fill(0)

    orcamentosAnuais.forEach((orcamento) => {
      orcamentosMensais[orcamento.mes - 1] = orcamento.valor
    })

    const response = orcamentosMensais.map((valor, index) => ({
      mes: index + 1,
      nome: monthNames[index],
      valor: valor,
    }))

    return res.status(200).json({
      message: "Orçamentos anuais obtidos com sucesso",
      orcamentos: response,
    })
  } catch (error) {
    console.error("Erro ao obter orçamentos anuais:", error)
    return res.status(500).json({
      message: "Erro ao obter orçamentos anuais",
      error: (error as Error).message,
    })
  }
}
