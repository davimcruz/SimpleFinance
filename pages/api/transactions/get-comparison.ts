import { NextApiRequest, NextApiResponse } from "next"
import { getTransactions } from "./get-transactions"
import { Transaction } from "@/types/types"
import { verifyToken } from "../middleware/jwt-auth"
import { parseCookies } from "nookies"

export default async function queryComparison(
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

    const currentYear = new Date().getFullYear().toString()
    const transactions = await getTransactions(userId)

    if (!transactions) {
      return res.status(500).json({ error: "Erro ao buscar transações" })
    }

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
