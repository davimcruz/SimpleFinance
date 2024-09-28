import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient, transacoes } from "@prisma/client"
import { verifyToken } from "../Auth/jwtAuth" 
import { parseCookies } from "nookies"

const prisma = new PrismaClient()

export default async function queryTransactions(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<transacoes[]> {
  try {
    const tokenValid = await verifyToken({ req } as any)
    if (!tokenValid) {
      res.status(401).json({ error: "Não autorizado" })
      return []
    }

    const cookies = parseCookies({ req })
    const userId = Number(cookies.userId)

    if (!userId || isNaN(userId)) {
      throw new Error("ID de usuário inválido ou não encontrado nos cookies.")
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
    if (process.env.NODE_ENV === "development") {
      await prisma.$disconnect()
    }
  }
}
