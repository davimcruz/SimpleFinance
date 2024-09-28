import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient, transacoes } from "@prisma/client" 
import { verifyToken } from "../Auth/jwtAuth"
import { parseCookies } from "nookies"

const prisma = new PrismaClient()

export default async function transactionsSummary(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
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

    const transactions: transacoes[] = await prisma.transacoes.findMany({
      where: { userId },
    })

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1

    // Filtrar transações por mês
    const filterTransactionsByMonth = (month: number): transacoes[] =>
      transactions.filter((transaction: transacoes) => {
        const transactionMonth = transaction.data?.split("-")[1]
        return transactionMonth === month.toString().padStart(2, "0")
      })

    const transactionsThisMonth = filterTransactionsByMonth(currentMonth)
    const transactionsLastMonth = filterTransactionsByMonth(lastMonth)

    const calculateTotals = (transactions: transacoes[]) => {
      let totalAvailable = 0,
        totalIncome = 0,
        totalExpense = 0

      transactions.forEach((transaction: transacoes) => {
        if (transaction.valor) {
          const value = parseFloat(transaction.valor.replace(",", "."))
          totalAvailable += value
          if (transaction.tipo === "receita") totalIncome += value
          if (transaction.tipo === "despesa") totalExpense += value
        }
      })

      return {
        totalAvailable: parseFloat(totalAvailable.toFixed(2)),
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        totalExpense: parseFloat(totalExpense.toFixed(2)),
      }
    }

    const totalsThisMonth = calculateTotals(transactionsThisMonth)
    const totalsLastMonth = calculateTotals(transactionsLastMonth)

    // Diferenças percentuais
    const calculatePercentageDifference = (current: number, previous: number) =>
      previous > 0 ? ((current - previous) / previous) * 100 : 0

    const balanceDifferencePercentage = calculatePercentageDifference(
      totalsThisMonth.totalAvailable,
      totalsLastMonth.totalAvailable
    )
    const incomeDifferencePercentage = calculatePercentageDifference(
      totalsThisMonth.totalIncome,
      totalsLastMonth.totalIncome
    )
    const expenseDifferencePercentage = calculatePercentageDifference(
      totalsThisMonth.totalExpense,
      totalsLastMonth.totalExpense
    )

    // Diferenças percentuais
    const formatPercentageDifference = (percentage: number) =>
      percentage > 0
        ? `+${percentage.toFixed(2)}%`
        : `${percentage.toFixed(2)}%`

    const balanceDifferenceString = formatPercentageDifference(
      balanceDifferencePercentage
    )
    const incomeDifferenceString = formatPercentageDifference(
      incomeDifferencePercentage
    )
    const expenseDifferenceString = formatPercentageDifference(
      expenseDifferencePercentage
    )

    // Responsável por calcular o saldo total de todas as transações
    const totalBalance = transactions.reduce(
      (total: number, transaction: transacoes) => {
        if (transaction.valor) {
          const value = parseFloat(transaction.valor.replace(",", "."))
          return total + value
        }
        return total
      },
      0
    )

    res.status(200).json({
      totalAvailableThisMonth: totalsThisMonth.totalAvailable,
      totalIncomeThisMonth: totalsThisMonth.totalIncome,
      totalExpenseThisMonth: totalsThisMonth.totalExpense,
      totalIncomeLastMonth: totalsLastMonth.totalIncome,
      totalExpenseLastMonth: totalsLastMonth.totalExpense,
      balanceDifferenceString,
      incomeDifferenceString,
      expenseDifferenceString,
      totalBalance: parseFloat(totalBalance.toFixed(2)),
    })
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    res.status(500).json({ error: "Erro ao buscar transações" })
  }
}
