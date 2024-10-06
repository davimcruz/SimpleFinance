import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient, transacoes } from "@prisma/client"
import { parseCookies } from "nookies"
import { verifyToken } from "../Auth/jwtAuth"

import prisma from "@/lib/prisma"

export default async function transactionsTable(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const tokenValid = await verifyToken({ req } as any)
    if (!tokenValid) {
      return res.status(401).json({ error: "Não autorizado" })
    }

    const cookies = parseCookies({ req })
    const userId = Number(cookies.userId)

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: "ID de usuário inválido" })
    }

    const transactions = await prisma.transacoes.findMany({
      where: { userId },
      include: {
        cartoes: {
          select: {
            nomeCartao: true, 
          },
        },
      },
    })


    const table = transactions.map((transaction) => ({
      transactionId: transaction.transactionId,
      nome: transaction.nome,
      tipo: transaction.tipo,
      fonte: transaction.fonte,
      detalhesFonte:
        transaction.fonte === "cartao-credito"
          ? transaction.cartoes?.nomeCartao || null
          : transaction.detalhesFonte || null,
      data: transaction.data || null,
      valor: transaction.valor ? Number(transaction.valor) : 0,
    }))

    res.status(200).json({ table })
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    res.status(500).json({ error: "Erro ao buscar transações" })
  }
}
