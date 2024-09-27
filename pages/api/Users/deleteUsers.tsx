import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function deleteUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { ids } = req.body

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({
      error: "É necessário enviar um array de IDs no corpo da requisição.",
    })
  }

  try {
    await prisma.orcamento.deleteMany({
      where: {
        userId: {
          in: ids,
        },
      },
    })

    await prisma.transacoes.deleteMany({
      where: {
        userId: {
          in: ids,
        },
      },
    })

    const deleteUsers = await prisma.usuarios.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })

    if (deleteUsers.count === 0) {
      return res
        .status(404)
        .json({ error: "Nenhum usuário encontrado para exclusão." })
    }

    res.status(200).json({
      message: "Usuários e transações excluídos com sucesso.",
      deletedCount: deleteUsers.count,
    })
  } catch (error) {
    console.error("Erro ao excluir usuários e transações:", error)
    res.status(500).json({ error: "Erro ao excluir usuários e transações." })
  } finally {
    await prisma.$disconnect()
  }
}
