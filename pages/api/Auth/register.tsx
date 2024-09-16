import type { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { nome, sobrenome, email, password } = req.body 

    console.log("Dados recebidos:", { nome, sobrenome, email, password })

    if (!nome || !sobrenome || !email || !password) {
      return res
        .status(400)
        .json({ error: "Por favor, preencha todos os campos." })
    }

    try {
      const existingUser = await prisma.usuarios.findUnique({
        where: { email },
      })

      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Usuário já registrado com este e-mail." })
      }

      console.log("Senha antes de criptografar:", password) 

      const hashedPassword = await bcrypt.hash(password, 10) 

      console.log("Senha criptografada:", hashedPassword)

      const newUser = await prisma.usuarios.create({
        data: {
          nome,
          sobrenome,
          email,
          senha: hashedPassword, 
        },
      })

      return res
        .status(201)
        .json({ message: "Usuário registrado com sucesso!", user: newUser })
    } catch (error) {
      console.error("Erro ao registrar usuário:", error)
      return res.status(500).json({ error: "Erro ao registrar usuário" })
    }
  } else {
    return res.status(405).json({ error: "Método não permitido" })
  }
}
