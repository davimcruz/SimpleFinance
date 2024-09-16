import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Requisição recebida:", req.method, req.body)

  if (req.method !== "POST") {
    console.log("Método não permitido:", req.method)
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { email, nome, sobrenome } = req.body

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
    console.error("Erro:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  } finally {
    console.log("Finalizando conexão com o banco de dados")
  }
}
