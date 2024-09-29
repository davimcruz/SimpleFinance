import { NextApiRequest, NextApiResponse } from "next"
import queryTransactions from "../Queries/queryTransactions"

export default async function progressTracker(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const transactions = await queryTransactions(req, res)

    const countTransactions = transactions.length

    res.status(200).json({ count: countTransactions })
  } catch (error) {
    console.error("Erro ao puxar as transações:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}
