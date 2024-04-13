import { NextApiRequest, NextApiResponse } from "next"
import queryTransactions from "../Queries/queryTransactions"

export default async function transactionsSummary(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0")

    console.log("Mês atual:", currentMonth)

    const transactions = await queryTransactions(req, res)

    const transactionsThisMonth = transactions.filter((transaction: any) => {
      const transactionMonth = transaction.data.split("-")[1]
      return transactionMonth === currentMonth
    })

    const lastMonth = new Date().getMonth().toString().padStart(2, "0")

    const transactionsLastMonth = transactions.filter((transaction: any) => {
      const transactionMonth = transaction.data.split("-")[1]
      return transactionMonth === lastMonth
    })

    let totalAvailableThisMonth = 0
    let totalIncomeThisMonth = 0
    let totalExpenseThisMonth = 0

    transactionsThisMonth.forEach((transaction: any) => {
      const valueWithDot = transaction.valor.replace(",", ".")
      totalAvailableThisMonth += parseFloat(valueWithDot)

      if (transaction.tipo === "receita") {
        totalIncomeThisMonth += parseFloat(valueWithDot)
      } else if (transaction.tipo === "despesa") {
        totalExpenseThisMonth += parseFloat(valueWithDot)
      }
    })

    let totalAvailableLastMonth = 0
    let totalIncomeLastMonth = 0
    let totalExpenseLastMonth = 0

    transactionsLastMonth.forEach((transaction: any) => {
      const valueWithDot = transaction.valor.replace(",", ".")
      totalAvailableLastMonth += parseFloat(valueWithDot)

      if (transaction.tipo === "receita") {
        totalIncomeLastMonth += parseFloat(valueWithDot)
      } else if (transaction.tipo === "despesa") {
        totalExpenseLastMonth += parseFloat(valueWithDot)
      }
    })

    const balanceDifferencePercentage =
      ((totalAvailableThisMonth - totalAvailableLastMonth) /
        totalAvailableLastMonth) *
      100
    const incomeDifferencePercentage =
      ((totalIncomeThisMonth - totalIncomeLastMonth) / totalIncomeLastMonth) *
      100
    const expenseDifferencePercentage =
      ((totalExpenseThisMonth - totalExpenseLastMonth) /
        totalExpenseLastMonth) *
      100

    const formatPercentageDifference = (percentage: number) => {
      return percentage > 0
        ? `+${percentage.toFixed(2)}%`
        : `${percentage.toFixed(2)}%`
    }

    const balanceDifferenceString = formatPercentageDifference(
      balanceDifferencePercentage
    )
    const incomeDifferenceString = formatPercentageDifference(
      incomeDifferencePercentage
    )
    const expenseDifferenceString = formatPercentageDifference(
      expenseDifferencePercentage
    )

    totalAvailableThisMonth = parseFloat(totalAvailableThisMonth.toFixed(2))
    totalAvailableThisMonth = totalIncomeThisMonth - totalExpenseThisMonth
    totalAvailableLastMonth = parseFloat(totalAvailableLastMonth.toFixed(2))

    const totalBalance = transactions.reduce(
      (total: number, transaction: any) => {
        const valueWithDot = transaction.valor.replace(",", ".")
        const value = parseFloat(valueWithDot)
        return total + value
      },
      0
    )

    res.status(200).json({
      totalAvailableThisMonth,
      totalIncomeThisMonth,
      totalExpenseThisMonth,
      totalIncomeLastMonth,
      totalExpenseLastMonth,
      balanceDifferenceString,
      incomeDifferenceString,
      expenseDifferenceString,
      totalBalance,
    })
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    res.status(500).json({ error: "Erro ao buscar transações" })
  }
}
