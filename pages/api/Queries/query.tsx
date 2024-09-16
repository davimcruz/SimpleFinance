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

  const { email } = req.query

  if (typeof email !== "string") {
    return res.status(400).json({ error: "Email inválido" })
  }

  try {
    const user = await prisma.usuarios.findUnique({
      where: { email },
      select: { id: true, nome: true, sobrenome: true, image: true },
    })

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" })
    }

    return res.status(200).json(user)
  } catch (error) {
    console.error("Erro:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  } finally {
    await prisma.$disconnect()
  }
}
