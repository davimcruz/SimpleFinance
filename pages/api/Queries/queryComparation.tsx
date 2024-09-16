import { NextApiRequest, NextApiResponse } from "next"
import queryTransactions from "../Queries/queryTransactions"
import { Transaction } from "@/types/types"

export default async function queryComparison(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const currentYear = new Date().getFullYear().toString()

    const transactions = await queryTransactions(req, res)

    const currentYearTransactions = transactions.filter(
      (transaction: Transaction) =>
        transaction.data?.includes(currentYear) ?? false
    )

    const monthlyTransactions: Record<
      string,
      { income: number; expense: number }
    > = {}

    currentYearTransactions.forEach((transaction: Transaction) => {
      const [year, month] = transaction.data?.split("-") || []

      if (!monthlyTransactions[month || ""]) {
        monthlyTransactions[month || ""] = { income: 0, expense: 0 }
      }

      const valueWithDot = transaction.valor?.replace(",", ".") || "0"
      const value = parseFloat(valueWithDot)

      if (transaction.tipo === "receita") {
        monthlyTransactions[month || ""].income += value
      } else if (transaction.tipo === "despesa") {
        monthlyTransactions[month || ""].expense += value
      }
    })

    res.status(200).json(monthlyTransactions)
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    res.status(500).json({ error: "Erro ao buscar transações" })
  }
}
