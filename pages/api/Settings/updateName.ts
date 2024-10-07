import { NextApiRequest, NextApiResponse } from "next"

import { verifyToken } from "../auth/jwt-auth"

import prisma from "@/lib/prisma"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Requisição recebida:", req.method, req.body)

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ error: "Não autorizado" })
  }

  if (req.method !== "POST") {
    console.log("Método não permitido:", req.method)
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { email, nome, sobrenome } = req.body

  if (
    !email ||
    !nome ||
    !sobrenome ||
    typeof email !== "string" ||
    typeof nome !== "string" ||
    typeof sobrenome !== "string"
  ) {
    return res.status(400).json({ error: "Dados inválidos" })
  }

  try {
    console.log("Atualizando usuário com email:", email)

    const updatedUser = await prisma.usuarios.update({
      where: { email },
      data: { nome, sobrenome },
    })

    console.log("Atualização bem-sucedida:", updatedUser)
    return res
      .status(200)
      .json({ message: "Nome e sobrenome atualizados com sucesso" })
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
