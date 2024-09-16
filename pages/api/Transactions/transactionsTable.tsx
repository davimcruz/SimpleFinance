import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function transactionsTable(
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

    const transactions = await prisma.transacoes.findMany({
      where: {
        userId: userId,
      },
    })

    const table: any[] = transactions.map((transaction) => ({
      transactionId: transaction.transactionId,
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
  } finally {
    await prisma.$disconnect()
  }
}
