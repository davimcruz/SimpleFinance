import { NextApiRequest, NextApiResponse } from "next"
import queryTransactions from "../Queries/queryTransactions"

export default async function transactionsTable(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const transactions = await queryTransactions(req, res)

    const table: any[] = transactions.map((transaction: any) => ({
      nome: transaction.nome,
      tipo: transaction.tipo,
      fonte: transaction.fonte,
      detalhesFonte: transaction.detalhesFonte,
      data: transaction.data,
      valor: transaction.valor,
    }))

    res.status(200).json({ table })
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    res.status(500).json({ error: "Erro ao buscar transações" })
  }
}
