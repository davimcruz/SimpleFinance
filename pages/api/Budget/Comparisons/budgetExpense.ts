import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "../../Auth/jwtAuth"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ message: "Não autorizado" })
  }

  const { userId, month, year } = req.query
  if (!userId || !month || !year) {
    return res.status(400).json({ message: "Parâmetros faltando." })
  }

  try {
    const budget = await prisma.orcamento.findFirst({
      where: {
        userId: Number(userId),
        mes: Number(month),
        ano: Number(year),
      },
    })

    if (!budget) {
      return res.status(404).json({ message: "Orçamento não encontrado." })
    }

    const transactions = await prisma.transacoes.findMany({
      where: {
        userId: Number(userId),
        tipo: "despesa", 
        data: {
          contains: `${year}-${String(month).padStart(2, "0")}`, 
        },
      },
    })

    const totalExpense = transactions.reduce((acc, transaction) => {
      const valor = transaction.valor
        ? parseFloat(transaction.valor.replace(",", "."))
        : 0
      return acc + valor
    }, 0)

    const comparison = budget.valor - totalExpense

    res.status(200).json({
      budget: budget.valor,
      expense: totalExpense,
      comparison:
        comparison >= 0
          ? `Orçamento excede as despesas por R$ ${comparison.toFixed(2)}`
          : `Despesas excedem o orçamento por R$ ${Math.abs(comparison).toFixed(
              2
            )}`,
    })
  } catch (error) {
    console.error("Erro ao comparar orçamento com despesas:", error)
    res.status(500).json({ error: "Erro ao comparar orçamento com despesas." })
  } finally {
    await prisma.$disconnect()
  }
}
