import { NextApiRequest, NextApiResponse } from "next"

import { verifyToken } from "../Auth/jwtAuth"

import prisma from "@/lib/prisma"

const getMonthName = (monthNumber: number) => {
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]
  return monthNames[monthNumber - 1]
}

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
    const mesAtualNome = getMonthName(mesAtual)

    const orcamentoMesAtual = await prisma.orcamento.findFirst({
      where: {
        userId: userIdNumber,
        ano: anoAtual,
        mes: mesAtual,
      },
      select: {
        valor: true,
      },
    })

    if (!orcamentoMesAtual) {
      return res.status(404).json({
        message: "Orçamento não encontrado para o mês atual",
      })
    }

    return res.status(200).json({
      message: "Orçamento do mês atual obtido com sucesso",
      totalOrcamento: orcamentoMesAtual.valor || 0,
      mesAtual: mesAtualNome,
    })
  } catch (error) {
    console.error("Erro ao obter orçamento:", error)
    return res.status(500).json({
      message: "Erro ao obter orçamento",
      error: (error as Error).message,
    })
  }
}
