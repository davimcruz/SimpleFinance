import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "@/pages/api/Auth/jwtAuth"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Recebendo requisição para comparação anual de receita...")

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    console.log("Token inválido. Requisição não autorizada.")
    return res.status(401).json({ message: "Não autorizado" })
  }

  const { userId } = req.query

  if (!userId || isNaN(Number(userId))) {
    console.log("Parâmetro userId ausente ou inválido.")
    return res
      .status(400)
      .json({ message: "Parâmetro userId é obrigatório e deve ser válido." })
  }

  const userIdNumber = Number(userId)
  const currentYear = new Date().getFullYear()

  try {
    const [user, budgets, transactions] = await Promise.all([
      prisma.usuarios.findUnique({ where: { id: userIdNumber } }),
      prisma.orcamento.findMany({
        where: {
          userId: userIdNumber,
          ano: currentYear,
          status: { in: ["excedente", "deficit", "futuro", "padrao"] },
        },
        select: { mes: true, valor: true }, 
        orderBy: { mes: "asc" },
      }),
      prisma.transacoes.findMany({
        where: {
          userId: userIdNumber,
          tipo: "receita",
          data: { contains: `-${currentYear}` },
        }, 
        select: { valor: true, data: true },
      }),
    ])

    if (!user) {
      console.log("Usuário não encontrado.")
      return res.status(404).json({ message: "Usuário não encontrado" })
    }

    if (!budgets.length) {
      console.log("Nenhum orçamento encontrado para o usuário no ano atual.")
      return res.status(404).json({ message: "Nenhum orçamento encontrado" })
    }

    const receitaPorMes = transactions.reduce((acc, transacao) => {
      const [_, monthStr, yearStr] = (transacao.data || "").split("-")
      const mes = parseInt(monthStr || "0", 10)
      const ano = parseInt(yearStr || "0", 10)

      if (ano === currentYear) {
        if (!acc[mes]) acc[mes] = 0
        acc[mes] += parseFloat(transacao.valor.toString())
      }

      return acc
    }, {} as Record<number, number>)

    const calculateGap = (receitaReal: number, budgetValue: number) => {
      const gapMoney = receitaReal - budgetValue
      const gapPercentage =
        gapMoney !== 0
          ? `${((gapMoney / budgetValue) * 100).toFixed(2)}%`
          : "0%"
      const status =
        gapMoney > 0 ? "excedente" : gapMoney < 0 ? "deficit" : "padrao"
      return { gapMoney, gapPercentage, status }
    }

    const mesesComReceita = Object.keys(receitaPorMes).map(Number)
    const primeiroMesComReceita = Math.min(...mesesComReceita)
    const ultimoMesComReceita = Math.max(...mesesComReceita)

    const results = budgets.map((budget) => {
      const month = budget.mes
      const budgetValue = budget.valor

      let receitaReal = receitaPorMes[month] || 0
      let statusReceita = "padrao"
      let gapMoneyReceita = 0
      let gapPercentageReceita = "0%"

      if (receitaReal > 0) {
        const gapResult = calculateGap(receitaReal, budgetValue)
        gapMoneyReceita = gapResult.gapMoney
        gapPercentageReceita = gapResult.gapPercentage
        statusReceita = gapResult.status
      } else {
        if (month < primeiroMesComReceita) {
          statusReceita = "padrao"
        } else if (month > ultimoMesComReceita) {
          statusReceita = "futuro"
          gapPercentageReceita = "-"
        } else {
          statusReceita = "sem receita"
        }
      }

      return {
        month,
        budget: budgetValue,
        receitaReal,
        statusReceita,
        gapMoneyReceita,
        gapPercentageReceita,
      }
    })

    return res.status(200).json(results)
  } catch (error) {
    console.error("Erro ao calcular receita anual:", error)
    return res.status(500).json({
      message: "Erro ao calcular receita anual",
      error: (error as Error).message,
    })
  }
}
