import { NextApiRequest, NextApiResponse } from "next"
import queryTransactions from "./queryTransactions"
import { Transaction } from "@/types/types"
import { verifyToken } from "../Auth/jwtAuth"
export default async function queryMethods(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const tokenValid = await verifyToken({ req } as any)
    if (!tokenValid) {
      return res.status(401).json({ error: "Não autorizado" })
    }

    const transactions = await queryTransactions(req, res)

    const methods = [
      ...new Set(
        (transactions as Transaction[]).map((transaction) => transaction.fonte)
      ),
    ]

    res.status(200).json(methods)
  } catch (error) {
    console.error("Erro ao puxar os métodos:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}
