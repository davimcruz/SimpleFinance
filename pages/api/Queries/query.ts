import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { userId } = req.query

  const userIdNumber = Number(userId)
  if (isNaN(userIdNumber)) {
    return res.status(400).json({ error: "ID de usuário inválido." })
  }

  try {
    const user = await prisma.usuarios.findUnique({
      where: { id: userIdNumber },
      select: { id: true, nome: true, sobrenome: true, image: true },
    })

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" })
    }

    return res.status(200).json(user)
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
