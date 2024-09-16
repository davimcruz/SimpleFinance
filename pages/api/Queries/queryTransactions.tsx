import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient, transacoes } from "@prisma/client"

const prisma = new PrismaClient()

export default async function queryTransactions(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<transacoes[]> {
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

    const transactions = await prisma.transacoes.findMany({
      where: {
        userId: userId,
      },
    })

    return transactions
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    res.status(500).json({ error: "Erro ao buscar transações" })
    return []
  } finally {
    await prisma.$disconnect()
  }
}
