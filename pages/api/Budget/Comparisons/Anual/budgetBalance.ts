import { NextApiRequest, NextApiResponse } from "next"

import { verifyToken } from "@/pages/api/middleware/jwt-auth"

import prisma from "@/lib/prisma"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Recebendo requisição para comparação anual de saldo...")

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
        select: { mes: true, valor: true, status: true, saldoRealocado: true },
        orderBy: { mes: "asc" },
      }),
      prisma.transacoes.findMany({
        where: { userId: userIdNumber, data: { contains: `-${currentYear}` } },
        select: { valor: true, tipo: true, data: true },
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

    const transactionsPorMes = transactions.reduce((acc, transacao) => {
      const [_, monthStr, yearStr] = (transacao.data || "").split("-")
      const mes = parseInt(monthStr || "0", 10)
      const ano = parseInt(yearStr || "0", 10)

      if (ano === currentYear) {
        if (!acc[mes]) acc[mes] = { receita: 0, despesa: 0 }

        const valor = parseFloat(transacao.valor.toString())
        if (transacao.tipo === "receita") acc[mes].receita += valor
        else if (transacao.tipo === "despesa") acc[mes].despesa += valor
      }

      return acc
    }, {} as Record<number, { receita: number; despesa: number }>)

    const calculateGap = (balance: number, budgetValue: number) => {
      const gapMoney = balance - budgetValue
      const gapPercentage =
        gapMoney !== 0
          ? `${((gapMoney / budgetValue) * 100).toFixed(2)}%`
          : "0%"
      const status =
        gapMoney > 0 ? "excedente" : gapMoney < 0 ? "deficit" : "padrao"
      return { gapMoney, gapPercentage, status }
    }

    const results = budgets.map((budget) => {
      const month = budget.mes
      const budgetValue = budget.valor

      const saldoRealocado = budget.saldoRealocado || 0
      const transacoesMes = transactionsPorMes[month] || {
        receita: 0,
        despesa: 0,
      }
      const saldoSemRealocacao = transacoesMes.receita - transacoesMes.despesa

      const carryOverApplied = budget.status !== "padrao"

      const balanceRealocada = carryOverApplied
        ? saldoRealocado
        : saldoSemRealocacao
      const {
        gapMoney: gapMoneyRealocada,
        gapPercentage: gapPercentageRealocada,
        status: statusRealocada,
      } = calculateGap(balanceRealocada, budgetValue)

      const {
        gapMoney: gapMoneySemRealocacao,
        gapPercentage: gapPercentageSemRealocacao,
        status: statusSemRealocacao,
      } = calculateGap(saldoSemRealocacao, budgetValue)

      return {
        month,
        budget: budgetValue,
        balanceRealocada,
        balanceSemRealocacao: carryOverApplied ? saldoSemRealocacao : 0,
        statusRealocada: carryOverApplied ? statusRealocada : "padrao",
        statusSemRealocacao: carryOverApplied ? statusSemRealocacao : "padrao",
        gapMoneyRealocada: carryOverApplied ? gapMoneyRealocada : 0,
        gapPercentageRealocada: carryOverApplied ? gapPercentageRealocada : "-",
        gapMoneySemRealocacao: carryOverApplied ? gapMoneySemRealocacao : 0,
        gapPercentageSemRealocacao: carryOverApplied
          ? gapPercentageSemRealocacao
          : "-",
      }
    })

    return res.status(200).json(results)
  } catch (error) {
    console.error("Erro ao calcular saldos anuais:", error)
    return res.status(500).json({
      message: "Erro ao calcular saldos anuais",
      error: (error as Error).message,
    })
  }
}
