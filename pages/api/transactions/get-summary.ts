import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../middleware/jwt-auth"
import { parseCookies } from "nookies"
import prisma from "@/lib/prisma"
import Redis from "ioredis"

const redisUrl = process.env.REDIS_URL
const redisToken = process.env.REDIS_TOKEN

if (!redisUrl || !redisToken) {
  throw new Error(
    "Variáveis de Ambiente REDIS_URL e REDIS_TOKEN não estão definidas."
  )
}

const redis = new Redis(redisUrl, {
  password: redisToken,
  maxRetriesPerRequest: 5,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000)
    return delay
  },
  reconnectOnError: (err) => {
    const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"]
    if (targetErrors.some((targetError) => err.message.includes(targetError))) {
      return true
    }
    return false
  },
})

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

    const cacheKey = `summary:${userId}:${new Date().getFullYear()}`
    const cachedData = await redis.get(cacheKey)

    if (cachedData) {
      console.log("Dados recuperados do cache")
      return res.status(200).json(JSON.parse(cachedData))
    }

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1 
    console.log("Ano atual:", currentYear, "Mês atual:", currentMonth)

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
    let monthlyIncome = 0
    let monthlyExpense = 0

    transactions.forEach((transaction) => {
      const value = parseFloat(transaction.valor.toString())
      if (isNaN(value)) {
        console.warn(`Valor inválido encontrado: ${transaction.valor}`)
        return
      }

      if (transaction.data) {
        const [day, month, year] = transaction.data.split('-')
        const transactionDate = new Date(`${year}-${month}-${day}`)

        if (transaction.tipo === "receita") {
          annualIncome += value
          if (parseInt(month) === currentMonth && parseInt(year) === currentYear) {
            monthlyIncome += value
          }
        } else if (transaction.tipo === "despesa") {
          annualExpense += value
          if (parseInt(month) === currentMonth && parseInt(year) === currentYear) {
            monthlyExpense += value
          }
        } else {
          console.warn(`Tipo de transação inválido: ${transaction.tipo}`)
        }
      } else {
        console.warn(`Data inválida encontrada para a transação: ${JSON.stringify(transaction)}`)
      }
    })

    const annualBalance = annualIncome - annualExpense
    const monthlyBalance = monthlyIncome - monthlyExpense
    console.log("Cálculos finalizados:", { annualIncome, annualExpense, annualBalance, monthlyIncome, monthlyExpense, monthlyBalance })

    const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
    const currentMonthName = monthNames[currentMonth - 1]

    const summaryData = {
      annualIncome: annualIncome.toFixed(2),
      annualIncomeMessage: `Total de receitas para o ano de ${currentYear}`,
      annualExpense: annualExpense.toFixed(2),
      annualExpenseMessage: `Total de despesas para o ano de ${currentYear}`,
      annualBalance: annualBalance.toFixed(2),
      annualBalanceMessage: `Saldo total para o ano de ${currentYear}`,
      monthlyIncome: monthlyIncome.toFixed(2),
      monthlyIncomeMessage: `Total de receitas para o mês de ${currentMonthName}`,
      monthlyExpense: monthlyExpense.toFixed(2),
      monthlyExpenseMessage: `Total de despesas para o mês de ${currentMonthName}`,
      monthlyBalance: monthlyBalance.toFixed(2),
      monthlyBalanceMessage: `Saldo total para o mês de ${currentMonthName}`,
    }

    await redis.set(cacheKey, JSON.stringify(summaryData), 'EX', 3600)

    res.status(200).json(summaryData)
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
}
