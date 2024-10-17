import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../middleware/jwt-auth"
import { parseCookies } from "nookies"
import prisma from "@/lib/prisma"

export default async function transactionsSummary(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  console.log("Iniciando transactionsSummary")
  if (req.method !== "GET") {
    console.log("Método não permitido:", req.method)
    return res.status(405).json({ error: "Método não permitido" })
  }

  try {
    const tokenValid = await verifyToken({ req } as any)
    console.log("Token válido:", tokenValid)
    if (!tokenValid) {
      return res.status(401).json({ error: "Não autorizado" })
    }

    const cookies = parseCookies({ req })
    const userId = Number(cookies.userId)
    console.log("UserId extraído:", userId)

    if (!userId || isNaN(userId)) {
      console.log("ID de usuário inválido:", userId)
      return res.status(400).json({ error: "ID de usuário inválido" })
    }

    const currentYear = new Date().getFullYear()
    console.log("Ano atual:", currentYear)

    const transactions = await prisma.transacoes.findMany({
      where: {
        userId,
        data: {
          endsWith: `-${currentYear}`,
        },
      },
      select: {
        data: true,
        valor: true,
        tipo: true,
      },
    })
    console.log("Transações encontradas:", transactions.length)
    console.log("Transações:", JSON.stringify(transactions, null, 2))

    let annualIncome = 0
    let annualExpense = 0

    transactions.forEach((transaction) => {
      const value = parseFloat(transaction.valor.toString())
      if (isNaN(value)) {
        console.warn(`Valor inválido encontrado: ${transaction.valor}`)
        return
      }
      if (transaction.tipo === "receita") {
        annualIncome += value
      } else if (transaction.tipo === "despesa") {
        annualExpense += value
      } else {
        console.warn(`Tipo de transação inválido: ${transaction.tipo}`)
      }
    })

    const annualBalance = annualIncome - annualExpense
    console.log("Cálculos finalizados:", { annualIncome, annualExpense, annualBalance })

    res.status(200).json({
      annualIncome: annualIncome.toFixed(2),
      annualIncomeMessage: `Total de receitas para o ano de ${currentYear}`,
      annualExpense: annualExpense.toFixed(2),
      annualExpenseMessage: `Total de despesas para o ano de ${currentYear}`,
      annualBalance: annualBalance.toFixed(2),
      annualBalanceMessage: `Saldo total para o ano de ${currentYear}`,
    })
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
}
