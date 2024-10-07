import type { NextApiRequest, NextApiResponse } from "next"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { serialize } from "cookie"
import { registerSchema, RegisterInput } from "@lib/validation"
import prisma from "@lib/prisma"

interface RegisterResponse {
  message?: string
  error?: string
  user?: {
    id: number
    nome: string
    sobrenome: string
    email: string
  }
}

const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV !== "development",
  sameSite: "strict" as const,
  maxAge: 86400, 
  path: "/",
}

const setLoginCookies = (
  res: NextApiResponse,
  token: string,
  email: string,
  userId: number
) => {
  const cookieToken = serialize("token", token, {
    ...COOKIE_OPTIONS,
    httpOnly: true,
  })
  const cookieEmail = serialize("email", email, COOKIE_OPTIONS)
  const cookieUserId = serialize("userId", userId.toString(), COOKIE_OPTIONS)

  res.setHeader("Set-Cookie", [cookieToken, cookieEmail, cookieUserId])
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res
      .status(405)
      .json({ error: "Método não permitido. Utilize POST." })
  }

  const parseResult = registerSchema.safeParse(req.body)

  if (!parseResult.success) {
    const { errors } = parseResult.error
    const errorMessages = errors.map((err) => err.message).join(", ")
    return res.status(400).json({ error: errorMessages })
  }

  const { nome, sobrenome, email, password } = parseResult.data

  try {
    const existingUser = await prisma.usuarios.findUnique({ where: { email } })
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Usuário já registrado com este e-mail." })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.usuarios.create({
      data: {
        nome,
        sobrenome,
        email,
        senha: hashedPassword,
      },
      select: {
        id: true,
        nome: true,
        sobrenome: true,
        email: true,
      },
    })

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error("JWT_SECRET não está definido.")
      return res
        .status(500)
        .json({ error: "Configuração do servidor inválida." })
    }

    const token = jwt.sign(
      { email: newUser.email, userId: newUser.id },
      jwtSecret,
      { expiresIn: "24h" }
    )

    setLoginCookies(res, token, newUser.email, newUser.id)

    return res.status(201).json({
      message: "Usuário registrado e logado com sucesso!",
      user: {
        id: newUser.id,
        nome: newUser.nome,
        sobrenome: newUser.sobrenome,
        email: newUser.email,
      },
    })
  } catch (error) {
    console.error("Erro ao registrar usuário:", error)
    return res.status(500).json({ error: "Erro ao registrar usuário." })
  }
}
