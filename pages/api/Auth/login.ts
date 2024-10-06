import { NextApiRequest, NextApiResponse } from "next"

import bcrypt from "bcrypt"
import jwt, { Secret } from "jsonwebtoken"
import { serialize } from "cookie"

import prisma from "@/lib/prisma"

const setCookies = (
  res: NextApiResponse,
  token: string,
  email: string,
  userId: number
) => {
  const cookieOptions = {
    httpOnly: false,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict" as const,
    maxAge: 86400,
    path: "/",
  }

  res.setHeader("Set-Cookie", [
    serialize("token", token, { ...cookieOptions, httpOnly: true }),
    serialize("email", email, cookieOptions),
    serialize("userId", userId.toString(), cookieOptions),
  ])
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

    setCookies(res, token, user.email, user.id)

    return res.status(200).json({ message: "Login bem-sucedido." })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição." })
  }
}
