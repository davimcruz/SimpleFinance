import type { NextApiRequest, NextApiResponse } from "next"

import bcrypt from "bcrypt"
import jwt, { Secret } from "jsonwebtoken"
import { serialize } from "cookie"

import prisma from "@/lib/prisma"

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const setLoginCookies = (
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

  const { nome, sobrenome, email, password } = req.body

  if (!nome || !sobrenome || !email || !password) {
    return res
      .status(400)
      .json({ error: "Por favor, preencha todos os campos." })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Endereço de email inválido." })
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "A senha deve ter no mínimo 8 caracteres." })
  }

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
    })

    const token = jwt.sign(
      { email: newUser.email, userId: newUser.id },
      process.env.JWT_SECRET as Secret,
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
    return res.status(500).json({ error: "Erro ao registrar usuário" })
  }
}
