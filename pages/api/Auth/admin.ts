import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import jwt, { Secret } from "jsonwebtoken"
import { serialize } from "cookie"

const prisma = new PrismaClient()

const setCookies = (
  res: NextApiResponse,
  token: string,
  email: string,
  userId: number
) => {
  const options = {
    httpOnly: false,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict" as const, 
    maxAge: 86400,
    path: "/",
  }

  const cookieToken = serialize("token", token, { ...options, httpOnly: true })
  const cookieEmail = serialize("email", email, options)
  const cookieUserId = serialize("userId", userId.toString(), options)

  res.setHeader("Set-Cookie", [cookieToken, cookieEmail, cookieUserId])
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" })
  }

  try {
    const user = await prisma.usuarios.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: "Email não registrado." })

    const [passwordMatch, token] = await Promise.all([
      bcrypt.compare(password, user.senha),
      jwt.sign(
        { email: user.email, userId: user.id },
        process.env.JWT_SECRET as Secret,
        { expiresIn: "24h" }
      ),
    ])

    if (!passwordMatch)
      return res.status(401).json({ error: "Senha incorreta." })
    if (user.permissao !== "admin")
      return res.status(403).json({ error: "Acesso restrito." })

    setCookies(res, token, user.email, user.id)

    return res.status(200).json({ message: "Login de admin bem-sucedido." })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição." })
  }
}
