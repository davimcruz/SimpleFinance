import type { NextApiRequest, NextApiResponse } from "next"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { serialize } from "cookie"
import { loginSchema } from "@lib/validation"
import prisma from "@/lib/prisma"

interface LoginResponse {
  message?: string
  error?: string
}

const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV !== "development",
  sameSite: "strict" as const,
  maxAge: 86400, 
  path: "/",
}

const setCookies = (
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
  res: NextApiResponse<LoginResponse>
) {
  console.log(`Recebido método ${req.method} para /api/auth/login`)

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    console.warn(`Método ${req.method} não permitido para /api/auth/login`)
    return res
      .status(405)
      .json({ error: "Método não permitido. Utilize POST." })
  }

  const parseResult = loginSchema.safeParse(req.body)
  console.log(`Resultado da validação: ${parseResult.success}`)

  if (!parseResult.success) {
    const { errors } = parseResult.error
    const errorMessages = errors.map((err) => err.message).join(", ")
    console.warn(`Validação falhou: ${errorMessages}`)
    return res.status(400).json({ error: errorMessages })
  }

  const { email, password } = parseResult.data
  console.log(`Tentando autenticar usuário: ${email}`)

  try {
    const user = await prisma.usuarios.findUnique({
      where: { email },
      select: { id: true, email: true, senha: true, permissao: true },
    })

    if (!user) {
      console.warn(`Usuário não encontrado: ${email}`)
      return res.status(401).json({ error: "Email não registrado." })
    }

    const isPasswordValid = await bcrypt.compare(password, user.senha)
    console.log(`Senha válida: ${isPasswordValid}`)

    if (!isPasswordValid) {
      console.warn(`Senha incorreta para usuário: ${email}`)
      return res.status(401).json({ error: "Senha incorreta." })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error("JWT_SECRET não está definido.")
      return res
        .status(500)
        .json({ error: "Configuração do servidor inválida." })
    }

    const token = jwt.sign({ email: user.email, userId: user.id }, jwtSecret, {
      expiresIn: "24h",
    })
    console.log(`Token JWT gerado para usuário ${email}: ${token}`)

    setCookies(res, token, user.email, user.id)
    console.log(`Cookies definidos para usuário: ${email}`)

    return res.status(200).json({ message: "Login bem-sucedido." })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição." })
  }
}
