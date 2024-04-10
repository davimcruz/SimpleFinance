import { NextApiRequest, NextApiResponse } from "next"
import queryTransactions from "../Queries/queryTransactions"

export default async function transactionsSummary(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const transactions = await queryTransactions(req, res)

    let totalBalance = 0
    let totalIncome = 0
    let totalExpense = 0

    transactions.forEach((transaction: any) => {
      const valueWithDot = transaction.valor.replace(",", ".")
      totalBalance += parseFloat(valueWithDot)

      if (transaction.tipo === "receita") {
        totalIncome += parseFloat(valueWithDot)
      } else if (transaction.tipo === "despesa") {
        totalExpense += parseFloat(valueWithDot)
      }
    })

    totalBalance = parseFloat(totalBalance.toFixed(2))
    const totalAvailable = totalIncome - totalExpense

    res.status(200).json({ totalBalance, totalAvailable, totalIncome, totalExpense })
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    res.status(500).json({ error: "Erro ao buscar transações" })
  }
}
