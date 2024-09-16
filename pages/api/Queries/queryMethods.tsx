import { NextApiRequest, NextApiResponse } from "next"
import queryTransactions from "./queryTransactions"
import { Transaction } from "@/types/types"

export default async function queryMethods(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const transactions = await queryTransactions(req, res)

    const methods = (transactions as Transaction[]).map(
      (transaction) => transaction.fonte
    )

    res.status(200).json(methods)
  } catch (error) {
    console.error("Erro ao puxar os métodos:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}
