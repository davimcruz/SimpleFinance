import { NextApiRequest, NextApiResponse } from "next"
import queryTransactions from "./queryTransactions"
import { Transaction } from "@/types/types"
import { verifyToken } from "../Auth/jwtAuth"

export default async function queryComparison(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const tokenValid = await verifyToken({ req } as any)
    if (!tokenValid) {
      return res.status(401).json({ error: "Não autorizado" })
    }

    const currentYear = new Date().getFullYear().toString()

    const transactions = await queryTransactions(req, res)

    const monthlyTransactions: Record<
      string,
      { income: number; expense: number }
    > = {}

    transactions.forEach((transaction: Transaction) => {
      const [day, month, year] = transaction.data?.split("-") || []

      if (year === currentYear) {
        if (!monthlyTransactions[month]) {
          monthlyTransactions[month] = { income: 0, expense: 0 }
        }

        const value = transaction.valor ?? 0

        if (transaction.tipo === "receita") {
          monthlyTransactions[month].income += value
        } else if (transaction.tipo === "despesa") {
          monthlyTransactions[month].expense += value
        }
      }
    })

    res.status(200).json(monthlyTransactions)
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    res.status(500).json({ error: "Erro ao buscar transações" })
  }
}
