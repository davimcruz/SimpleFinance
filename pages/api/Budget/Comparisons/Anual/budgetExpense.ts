import { NextApiRequest, NextApiResponse } from "next"

import { verifyToken } from "@/pages/api/auth/jwt-auth"

import prisma from "@/lib/prisma"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    console.log("Token inválido. Requisição não autorizada.")
    return res.status(401).json({ message: "Não autorizado" })
  }

  const { userId } = req.query

  if (!userId || isNaN(Number(userId))) {
    console.log("Parâmetro userId ausente ou inválido.")
    return res
      .status(400)
      .json({ message: "Parâmetro userId é obrigatório e deve ser válido." })
  }

  const userIdNumber = Number(userId)
  const currentYear = new Date().getFullYear()

  try {
    const [user, budgets, transactions] = await Promise.all([
      prisma.usuarios.findUnique({ where: { id: userIdNumber } }),
      prisma.orcamento.findMany({
        where: {
          userId: userIdNumber,
          ano: currentYear,
          status: { in: ["excedente", "deficit", "futuro", "padrao"] },
        },
        select: { mes: true, valor: true },
        orderBy: { mes: "asc" },
      }),
      prisma.transacoes.findMany({
        where: {
          userId: userIdNumber,
          tipo: "despesa",
          data: { contains: `-${currentYear}` },
        },
        select: { valor: true, data: true },
      }),
    ])

    if (!user) {
      console.log("Usuário não encontrado.")
      return res.status(404).json({ message: "Usuário não encontrado" })
    }

    if (!budgets.length) {
      console.log("Nenhum orçamento encontrado para o usuário no ano atual.")
      return res.status(404).json({ message: "Nenhum orçamento encontrado" })
    }

    const despesasPorMes = transactions.reduce((acc, transacao) => {
      const [_, monthStr, yearStr] = (transacao.data || "").split("-")
      const mes = parseInt(monthStr || "0", 10)
      const ano = parseInt(yearStr || "0", 10)

      if (ano === currentYear) {
        if (!acc[mes]) acc[mes] = 0
        acc[mes] += parseFloat(transacao.valor.toString())
      }

      return acc
    }, {} as Record<number, number>)

    const calculateGap = (despesaReal: number, budgetValue: number) => {
      const gapMoney = budgetValue - despesaReal
      const gapPercentage =
        gapMoney !== 0
          ? `${((gapMoney / budgetValue) * 100).toFixed(2)}%`
          : "0%"
      const status =
        gapMoney > 0 ? "excedente" : gapMoney < 0 ? "deficit" : "padrao"
      return { gapMoney, gapPercentage, status }
    }

    const mesesComDespesa = Object.keys(despesasPorMes).map(Number)
    const primeiroMesComDespesa = Math.min(...mesesComDespesa)
    const ultimoMesComDespesa = Math.max(...mesesComDespesa)

    const results = budgets.map((budget) => {
      const month = budget.mes
      const budgetValue = budget.valor

      let despesaReal = despesasPorMes[month] || 0
      let statusDespesa = "padrao"
      let gapMoneyDespesa = 0
      let gapPercentageDespesa = "0%"

      if (despesaReal > 0) {
        const gapResult = calculateGap(despesaReal, budgetValue)
        gapMoneyDespesa = gapResult.gapMoney
        gapPercentageDespesa = gapResult.gapPercentage
        statusDespesa = gapResult.status
      } else {
        if (month < primeiroMesComDespesa) {
          statusDespesa = "padrao"
        } else if (month > ultimoMesComDespesa) {
          statusDespesa = "futuro"
          gapPercentageDespesa = "-"
        } else {
          statusDespesa = "sem despesa"
        }
      }

      return {
        month,
        budget: budgetValue,
        despesaReal,
        statusDespesa,
        gapMoneyDespesa,
        gapPercentageDespesa,
      }
    })

    return res.status(200).json(results)
  } catch (error) {
    console.error("Erro ao calcular despesas anuais:", error)
    return res.status(500).json({
      message: "Erro ao calcular despesas anuais",
      error: (error as Error).message,
    })
  }
}
