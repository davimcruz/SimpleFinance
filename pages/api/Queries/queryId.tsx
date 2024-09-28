import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "../Auth/jwtAuth"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ error: "Não autorizado" })
  }

  const { id } = req.query

  if (!id || typeof id !== "string" || isNaN(Number(id))) {
    return res.status(400).json({ error: "ID inválido" })
  }

  try {
    const user = await prisma.usuarios.findUnique({
      where: { id: parseInt(id) }, 
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
