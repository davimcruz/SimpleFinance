import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import jwt, { Secret } from "jsonwebtoken"
import { serialize } from "cookie"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    console.log("Método não permitido:", req.method)
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { email, password } = req.body

  console.log("Dados recebidos:", { email, password })

  if (!email || !password) {
    console.log("Email ou senha não fornecidos")
    return res.status(400).json({ error: "Email e senha são obrigatórios" })
  }

  try {
    const user = await prisma.usuarios.findUnique({
      where: { email },
    })

    console.log("Usuário encontrado:", user)

    if (!user) {
      console.log("Email não registrado")
      return res.status(401).json({ error: "Email não registrado." })
    }

    const passwordMatch = await bcrypt.compare(password, user.senha)

    console.log("Senha correspondente:", passwordMatch)

    if (!passwordMatch) {
      console.log("Senha incorreta")
      return res.status(401).json({ error: "Senha incorreta." })
    }

    const token = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET as Secret,
      { expiresIn: "24h" }
    )

    console.log("Token gerado:", token)

    const cookieToken = serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    })

    const cookieEmail = serialize("email", user.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    })

    const cookieUserId = serialize("userId", user.id.toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    })

    console.log("Cookies configurados:", {
      cookieToken,
      cookieEmail,
      cookieUserId,
    })

    res.setHeader("Set-Cookie", [cookieToken, cookieEmail, cookieUserId])

    return res.status(200).json({ message: "Login bem-sucedido." })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição." })
  }
}
