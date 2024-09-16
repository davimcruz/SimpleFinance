import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function transactionsSummary(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const cookies = req.headers.cookie
    if (!cookies) {
      throw new Error("Cookies não encontrados na requisição.")
    }

    const userIdCookie = cookies
      .split("; ")
      .find((row) => row.startsWith("userId="))
    if (!userIdCookie) {
      throw new Error("Cookie userId não encontrado na requisição.")
    }

    const userId = parseInt(userIdCookie.split("=")[1])
    if (isNaN(userId)) {
      throw new Error("Valor do userId nos cookies não é um número.")
    }

    // Consulta transações do usuário no banco de dados
    const transactions = await prisma.transacoes.findMany({
      where: {
        userId: userId,
      },
    })

    // Define o mês atual e o mês anterior
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0")
    const lastMonth =
      new Date().getMonth() === 0
        ? "12" // Se janeiro, o mês anterior é dezembro (Deve haver forma mais otimizada para fazer isso)
        : new Date().getMonth().toString().padStart(2, "0")

    // Filtra transações do mês atual
    const transactionsThisMonth = transactions.filter((transaction) => {
      const transactionMonth = transaction.data
        ? transaction.data.split("-")[1]
        : ""
      return transactionMonth === currentMonth
    })

    // Filtra transações do mês anterior
    const transactionsLastMonth = transactions.filter((transaction) => {
      const transactionMonth = transaction.data
        ? transaction.data.split("-")[1]
        : ""
      return transactionMonth === lastMonth
    })

    // Inicializa variáveis para cálculos
    let totalAvailableThisMonth = 0
    let totalIncomeThisMonth = 0
    let totalExpenseThisMonth = 0

    transactionsThisMonth.forEach((transaction) => {
      if (transaction.valor) {
        const valueWithDot = transaction.valor.replace(",", ".")
        const value = parseFloat(valueWithDot)

        totalAvailableThisMonth += value

        if (transaction.tipo === "receita") {
          totalIncomeThisMonth += value
        } else if (transaction.tipo === "despesa") {
          totalExpenseThisMonth += value
        }
      }
    })

    let totalAvailableLastMonth = 0
    let totalIncomeLastMonth = 0
    let totalExpenseLastMonth = 0

    transactionsLastMonth.forEach((transaction) => {
      if (transaction.valor) {
        const valueWithDot = transaction.valor.replace(",", ".")
        const value = parseFloat(valueWithDot)

        totalAvailableLastMonth += value

        if (transaction.tipo === "receita") {
          totalIncomeLastMonth += value
        } else if (transaction.tipo === "despesa") {
          totalExpenseLastMonth += value
        }
      }
    })

    // Calcula as diferenças percentuais entre os meses
    const balanceDifferencePercentage =
      totalAvailableLastMonth > 0
        ? ((totalAvailableThisMonth - totalAvailableLastMonth) /
            totalAvailableLastMonth) *
          100
        : 0
    const incomeDifferencePercentage =
      totalIncomeLastMonth > 0
        ? ((totalIncomeThisMonth - totalIncomeLastMonth) /
            totalIncomeLastMonth) *
          100
        : 0
    const expenseDifferencePercentage =
      totalExpenseLastMonth > 0
        ? ((totalExpenseThisMonth - totalExpenseLastMonth) /
            totalExpenseLastMonth) *
          100
        : 0

    // Formata as diferenças percentuais
    const formatPercentageDifference = (percentage: number) => {
      return percentage > 0
        ? `+${percentage.toFixed(2)}%`
        : `${percentage.toFixed(2)}%`
    }

    const balanceDifferenceString = formatPercentageDifference(
      balanceDifferencePercentage
    )
    const incomeDifferenceString = formatPercentageDifference(
      incomeDifferencePercentage
    )
    const expenseDifferenceString = formatPercentageDifference(
      expenseDifferencePercentage
    )

    // Ajusta totais para o mês atual
    totalAvailableThisMonth = parseFloat(totalAvailableThisMonth.toFixed(2))
    totalAvailableThisMonth = totalIncomeThisMonth - totalExpenseThisMonth
    totalAvailableLastMonth = parseFloat(totalAvailableLastMonth.toFixed(2))

    // Calcula o saldo total das transações
    const totalBalance = transactions.reduce((total: number, transaction) => {
      if (transaction.valor) {
        const valueWithDot = transaction.valor.replace(",", ".")
        const value = parseFloat(valueWithDot)
        return total + value
      }
      return total
    }, 0)

    res.status(200).json({
      totalAvailableThisMonth,
      totalIncomeThisMonth,
      totalExpenseThisMonth,
      totalIncomeLastMonth,
      totalExpenseLastMonth,
      balanceDifferenceString,
      incomeDifferenceString,
      expenseDifferenceString,
      totalBalance,
    })
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    res.status(500).json({ error: "Erro ao buscar transações" })
  } finally {
    await prisma.$disconnect()
  }
}
