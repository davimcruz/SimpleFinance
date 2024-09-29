import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "../../Auth/jwtAuth"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Recebendo requisição para comparação de saldo...")

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    console.log("Token inválido. Requisição não autorizada.")
    return res.status(401).json({ message: "Não autorizado" })
  }

  const { userId, month, year } = req.query

  if (!userId || !month || !year) {
    console.log("Parâmetros ausentes: ", { userId, month, year })
    return res.status(400).json({ message: "Parâmetros obrigatórios ausentes" })
  }

  const userIdNumber = Number(userId)
  const monthNumber = Number(month)
  const yearNumber = Number(year)

  if (isNaN(userIdNumber) || isNaN(monthNumber) || isNaN(yearNumber)) {
    console.log("Parâmetros inválidos: ", { userId, month, year })
    return res.status(400).json({ message: "Parâmetros inválidos" })
  }

  console.log("Parâmetros recebidos:", {
    userIdNumber,
    monthNumber,
    yearNumber,
  })

  try {
    const budget = await prisma.orcamento.findFirst({
      where: {
        userId: userIdNumber,
        mes: monthNumber,
        ano: yearNumber,
      },
    })

    if (!budget) {
      console.log(
        "Orçamento não encontrado para o usuário no mês e ano fornecidos."
      )
      return res.status(404).json({ message: "Orçamento não encontrado" })
    }

    console.log("Orçamento encontrado:", budget.valor)

    const totalIncome = await prisma.transacoes.findMany({
      where: {
        userId: userIdNumber,
        tipo: "receita",
      },
      select: {
        valor: true,
        data: true, 
      },
    })

    const totalExpense = await prisma.transacoes.findMany({
      where: {
        userId: userIdNumber,
        tipo: "despesa",
      },
      select: {
        valor: true,
        data: true, 
      },
    })

    const filteredIncome = totalIncome.filter((t) => {
      const [day, month, year] = (t.data || "").split("-")
      const transactionMonth = parseInt(month, 10)
      const transactionYear = parseInt(year, 10)

      return transactionMonth === monthNumber && transactionYear === yearNumber
    })

    const filteredExpense = totalExpense.filter((t) => {
      const [day, month, year] = (t.data || "").split("-")
      const transactionMonth = parseInt(month, 10)
      const transactionYear = parseInt(year, 10)

      return transactionMonth === monthNumber && transactionYear === yearNumber
    })

    const totalIncomeValue = filteredIncome
      .map((t) => parseFloat(t.valor || "0"))
      .reduce((acc, curr) => acc + curr, 0)

    const totalExpenseValue = filteredExpense
      .map((t) => parseFloat(t.valor || "0"))
      .reduce((acc, curr) => acc + curr, 0)

    const balance = totalIncomeValue - totalExpenseValue
    console.log("Saldo final:", balance)

    const comparison =
      balance >= budget.valor
        ? "Saldo suficiente para o orçamento"
        : "Saldo insuficiente para o orçamento"

    console.log("Resultado da comparação:", comparison)

    return res.status(200).json({
      budget: budget.valor,
      income: totalIncomeValue,
      expense: totalExpenseValue,
      balance,
      comparison,
    })
  } catch (error) {
    console.error("Erro ao calcular saldo:", error)
    return res.status(500).json({
      message: "Erro ao calcular saldo",
      error: (error as Error).message,
    })
  }
}
