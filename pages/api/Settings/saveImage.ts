import { NextApiRequest, NextApiResponse } from "next"

import { verifyToken } from "../auth/middleware-jwt-auth"

import prisma from "@/lib/prisma"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ error: "Não autorizado" })
  }

  const { email, imageUrl } = req.body

  if (
    !email ||
    typeof email !== "string" ||
    !imageUrl ||
    typeof imageUrl !== "string"
  ) {
    return res.status(400).json({ error: "Dados inválidos" })
  }

  try {
    const updatedUser = await prisma.usuarios.update({
      where: { email },
      data: { image: imageUrl },
    })

    console.log("Usuário atualizado:", updatedUser)

    return res.status(200).json({ success: imageUrl })
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
