import type { NextApiRequest, NextApiResponse } from "next"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { serialize } from "cookie"
import { loginSchema } from "@/lib/validation"
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
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res
      .status(405)
      .json({ error: "Método não permitido. Utilize POST." })
  }

  const parseResult = loginSchema.safeParse(req.body)

  if (!parseResult.success) {
    const { errors } = parseResult.error
    const errorMessages = errors.map((err) => err.message).join(", ")
    return res.status(400).json({ error: errorMessages })
  }

  const { email, password } = parseResult.data

  try {
    const user = await prisma.usuarios.findUnique({
      where: { email },
      select: { id: true, email: true, senha: true, permissao: true },
    })

    if (!user) {
      return res.status(401).json({ error: "Email não registrado." })
    }

    const isPasswordValid = await bcrypt.compare(password, user.senha)
    if (!isPasswordValid) {
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

    setCookies(res, token, user.email, user.id)

    return res.status(200).json({ message: "Login bem-sucedido." })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição." })
  }
}
