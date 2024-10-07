import { NextApiRequest, NextApiResponse } from "next"

import { verifyToken } from "@/pages/api/auth/jwt-auth"

import prisma from "@/lib/prisma"

const monthNames: { [key: number]: string } = {
  1: "Janeiro",
  2: "Fevereiro",
  3: "Março",
  4: "Abril",
  5: "Maio",
  6: "Junho",
  7: "Julho",
  8: "Agosto",
  9: "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro",
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(
    "Recebendo requisição para comparar orçamento e despesas do mês atual..."
  )

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    console.log("Token inválido. Requisição não autorizada.")
    return res.status(401).json({ message: "Não autorizado" })
  }

  const { userId } = req.body

  if (!userId || isNaN(Number(userId))) {
    console.log("Parâmetro userId ausente ou inválido.")
    return res
      .status(400)
      .json({ message: "Parâmetro userId é obrigatório e deve ser válido." })
  }

  const userIdNumber = Number(userId)
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  try {
    const [budget, expenses] = await Promise.all([
      prisma.orcamento.findFirst({
        where: {
          userId: userIdNumber,
          mes: currentMonth,
          ano: currentYear,
        },
        select: { valor: true },
      }),
      prisma.transacoes.findMany({
        where: {
          userId: userIdNumber,
          tipo: "despesa",
          data: {
            contains: `-${currentMonth
              .toString()
              .padStart(2, "0")}-${currentYear}`,
          },
        },
        select: { valor: true },
      }),
    ])

    if (!budget) {
      return res.status(404).json({
        message: `Nenhum orçamento encontrado para ${monthNames[currentMonth]} ${currentYear}`,
      })
    }

    const despesasTotais = expenses.reduce((total, transacao) => {
      return total + parseFloat(transacao.valor.toString())
    }, 0)

    const relacao = (despesasTotais / budget.valor) * 100

    return res.status(200).json({
      budget: budget.valor,
      expenses: despesasTotais,
      percentage: relacao.toFixed(2),
    })
  } catch (error) {
    console.error("Erro ao buscar dados:", error)
    return res.status(500).json({
      message: "Erro ao calcular relação de orçamento e despesas",
      error: (error as Error).message,
    })
  }
}
