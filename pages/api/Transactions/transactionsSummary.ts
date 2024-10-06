import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient, transacoes } from "@prisma/client"
import { verifyToken } from "../Auth/jwtAuth"
import { parseCookies } from "nookies"

import prisma from "@/lib/prisma"

export default async function transactionsSummary(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  console.log("Iniciando requisição...")

  try {
    const tokenValid = await verifyToken({ req } as any)
    if (!tokenValid) {
      return res.status(401).json({ error: "Não autorizado" })
    }

    const cookies = parseCookies({ req })
    const userId = Number(cookies.userId)

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: "ID de usuário inválido" })
    }

    console.log("ID do usuário obtido:", userId)

    const transactions = await prisma.transacoes.findMany({
      where: { userId },
    })

    if (!transactions.length) {
      return res.status(200).json({
        totalIncomeThisMonth: 0,
        totalExpenseThisMonth: 0,
        balanceThisMonth: 0,
        totalIncomeLastMonth: 0,
        totalExpenseLastMonth: 0,
        incomeDifferenceString: "+0%",
        expenseDifferenceString: "+0%",
        balanceDifferenceString: "+0%",
      })
    }

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1

    const filterTransactionsByMonth = (month: number): transacoes[] => {
      const monthString = month.toString().padStart(2, "0")
      return transactions.filter((transaction) => {
        const transactionMonth = transaction.data?.split("-")[1]
        return transactionMonth === monthString
      })
    }

    const transactionsThisMonth = filterTransactionsByMonth(currentMonth)
    const transactionsLastMonth = filterTransactionsByMonth(lastMonth)

    const calculateTotals = (transactions: transacoes[]) => {
      return transactions.reduce(
        (totals, transaction) => {
          const value = parseFloat(
            String(transaction.valor)?.replace(",", ".") || "0"
          )
          if (transaction.tipo === "receita") {
            totals.totalIncome += value
          } else if (transaction.tipo === "despesa") {
            totals.totalExpense += value
          }
          return totals
        },
        {
          totalIncome: 0,
          totalExpense: 0,
        }
      )
    }

    const totalsThisMonth = calculateTotals(transactionsThisMonth)
    const totalsLastMonth = calculateTotals(transactionsLastMonth)

    const balanceThisMonth =
      totalsThisMonth.totalIncome - totalsThisMonth.totalExpense
    const balanceLastMonth =
      totalsLastMonth.totalIncome - totalsLastMonth.totalExpense

    const calculatePercentageDifference = (
      current: number,
      previous: number
    ) => {
      if (previous === 0) return 0
      return ((current - previous) / previous) * 100
    }

    const incomeDifferencePercentage = calculatePercentageDifference(
      totalsThisMonth.totalIncome,
      totalsLastMonth.totalIncome
    )
    const expenseDifferencePercentage = calculatePercentageDifference(
      totalsThisMonth.totalExpense,
      totalsLastMonth.totalExpense
    )
    const balanceDifferencePercentage = calculatePercentageDifference(
      balanceThisMonth,
      balanceLastMonth
    )

    const formatPercentageDifference = (percentage: number) =>
      percentage > 0
        ? `+${percentage.toFixed(2)}%`
        : `${percentage.toFixed(2)}%`

    const incomeDifferenceString = formatPercentageDifference(
      incomeDifferencePercentage
    )
    const expenseDifferenceString = formatPercentageDifference(
      expenseDifferencePercentage
    )
    const balanceDifferenceString = formatPercentageDifference(
      balanceDifferencePercentage
    )

    res.status(200).json({
      totalIncomeThisMonth: totalsThisMonth.totalIncome.toFixed(2),
      totalExpenseThisMonth: totalsThisMonth.totalExpense.toFixed(2),
      balanceThisMonth: balanceThisMonth.toFixed(2),
      totalIncomeLastMonth: totalsLastMonth.totalIncome.toFixed(2),
      totalExpenseLastMonth: totalsLastMonth.totalExpense.toFixed(2),
      incomeDifferenceString,
      expenseDifferenceString,
      balanceDifferenceString,
    })
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    res.status(500).json({ error: "Erro ao buscar transações" })
  }
}
