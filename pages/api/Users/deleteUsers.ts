import { NextApiRequest, NextApiResponse } from "next"

import { verifyToken } from "../auth/middleware-jwt-auth"

import prisma from "@/lib/prisma"

export default async function deleteUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ error: "Não autorizado" })
  }

  const { ids } = req.body

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({
      error: "É necessário enviar um array de IDs no corpo da requisição.",
    })
  }

  try {
    const [deletedBudgets, deletedTransactions, deleteUsers] =
      await Promise.all([
        prisma.orcamento.deleteMany({
          where: {
            userId: { in: ids },
          },
        }),
        prisma.transacoes.deleteMany({
          where: {
            userId: { in: ids },
          },
        }),
        prisma.usuarios.deleteMany({
          where: {
            id: { in: ids },
          },
        }),
      ])

    if (deleteUsers.count === 0) {
      return res
        .status(404)
        .json({ error: "Nenhum usuário encontrado para exclusão." })
    }

    res.status(200).json({
      message: "Usuários, orçamentos e transações excluídos com sucesso.",
      deletedUsers: deleteUsers.count,
      deletedBudgets: deletedBudgets.count,
      deletedTransactions: deletedTransactions.count,
    })
  } catch (error) {
    console.error("Erro ao excluir usuários e transações:", error)
    return res
      .status(500)
      .json({ error: "Erro ao excluir usuários e transações." })
  }
}
