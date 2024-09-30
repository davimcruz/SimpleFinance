import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "@/pages/api/Auth/jwtAuth"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Recebendo requisição para comparação anual de saldo...")

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    console.log("Token inválido. Requisição não autorizada.")
    return res.status(401).json({ message: "Não autorizado" })
  }

  const { userId } = req.query

  if (!userId) {
    console.log("Parâmetro userId ausente.")
    return res.status(400).json({ message: "Parâmetro userId é obrigatório" })
  }

  const userIdNumber = Number(userId)
  if (isNaN(userIdNumber)) {
    console.log("Parâmetro userId inválido.")
    return res.status(400).json({ message: "Parâmetro userId inválido" })
  }

  const currentYear = new Date().getFullYear()

  try {
    const user = await prisma.usuarios.findUnique({
      where: { id: userIdNumber },
    })

    if (!user) {
      console.log("Usuário não encontrado.")
      return res.status(404).json({ message: "Usuário não encontrado" })
    }

    const budgets = await prisma.orcamento.findMany({
      where: {
        userId: userIdNumber,
        ano: currentYear,
        status: {
          in: ["excedente", "deficit", "futuro"],
        },
      },
      select: {
        mes: true,
        valor: true,
        status: true,
      },
    })

    if (!budgets || budgets.length === 0) {
      console.log("Nenhum orçamento encontrado para o usuário no ano atual.")
      return res.status(404).json({ message: "Nenhum orçamento encontrado" })
    }

    const transactions = await prisma.transacoes.findMany({
      where: {
        userId: userIdNumber,
        data: {
          contains: `-${currentYear}`,
        },
      },
      select: {
        valor: true,
        tipo: true,
        data: true,
      },
    })

    const transactionsPerMonth: Record<
      number,
      { income: number; expense: number }
    > = {}

    transactions.forEach((transaction) => {
      const [day, monthStr, yearStr] = (transaction.data || "").split("-")
      const month = parseInt(monthStr, 10)
      const year = parseInt(yearStr, 10)

      if (year === currentYear) {
        if (!transactionsPerMonth[month]) {
          transactionsPerMonth[month] = { income: 0, expense: 0 }
        }

        const value = parseFloat(transaction.valor.toString())

        if (transaction.tipo === "receita") {
          transactionsPerMonth[month].income += value
        } else if (transaction.tipo === "despesa") {
          transactionsPerMonth[month].expense += value
        }
      }
    })

    const results = budgets.map((budget) => {
      const month = budget.mes
      let income = 0
      let expense = 0
      let balance = 0
      let gapMoney = 0
      let gapPercentage = "0%"

      if (budget.status !== "futuro") {
        income = transactionsPerMonth[month]?.income || 0
        expense = transactionsPerMonth[month]?.expense || 0
        balance = income - expense

        gapMoney = balance - parseFloat(budget.valor.toString())
        const percentageValue =
          parseFloat(budget.valor.toString()) !== 0
            ? (gapMoney / parseFloat(budget.valor.toString())) * 100
            : 0

        if (budget.status === "excedente") {
          gapPercentage = `+${percentageValue.toFixed(2)}%`
        } else if (budget.status === "deficit") {
          gapPercentage = `${percentageValue.toFixed(2)}%`
        }
      }

      return {
        month: month,
        budget: parseFloat(budget.valor.toString()),
        balance: balance,
        status: budget.status,
        gapMoney: gapMoney,
        gapPercentage: gapPercentage,
      }
    })


    return res.status(200).json(results)
  } catch (error) {
    console.error("Erro ao calcular saldos anuais:", error)
    return res.status(500).json({
      message: "Erro ao calcular saldos anuais",
      error: (error as Error).message,
    })
  }
}
