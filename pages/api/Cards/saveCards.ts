import { NextApiRequest, NextApiResponse } from "next"

import { verifyToken } from "@/pages/api/auth/middleware-jwt-auth"
import * as z from "zod"

import prisma from "@/lib/prisma"

const cardSchema = z.object({
  userId: z.number().positive(),
  nome: z.string().min(1, { message: "Nome do cartão é obrigatório" }),
  bandeira: z.enum([
    "Mastercard",
    "Visa",
    "Elo",
    "American Express",
    "Hipercard",
  ]),
  instituicao: z.string().min(1, { message: "Instituição é obrigatória" }),
  tipo: z.enum(["credito", "debito"]),
  vencimento: z.number().optional(),
  limite: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, {
      message: "Limite deve ser um valor numérico",
    })
    .optional(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      console.log("Método não permitido")
      return res.status(405).json({ message: "Método não permitido" })
    }

    const tokenValid = await verifyToken({ req } as any)
    console.log("Token verificado:", tokenValid)

    if (!tokenValid) {
      console.log("Token inválido ou não autorizado.")
      return res.status(401).json({ message: "Não autorizado" })
    }

    const parsedBody = cardSchema.safeParse(req.body)

    if (!parsedBody.success) {
      console.log("Erro de validação:", parsedBody.error.flatten().fieldErrors)
      return res.status(400).json({
        message: "Dados inválidos",
        errors: parsedBody.error.flatten().fieldErrors,
      })
    }

    const { userId, nome, bandeira, instituicao, tipo, vencimento, limite } =
      parsedBody.data

    console.log("Dados validados com sucesso:", {
      userId,
      nome,
      bandeira,
      instituicao,
      tipo,
      vencimento,
      limite,
    })

    const cartoesExistentes = await prisma.cartoes.count({
      where: {
        userId: userId,
        tipoCartao: tipo,
      },
    })

    if (cartoesExistentes >= 3) {
      console.log(`Usuário já possui 3 cartões do tipo ${tipo}`)
      return res
        .status(400)
        .json({ message: `Você já possui 3 cartões do tipo ${tipo}` })
    }

    const novoCartao = await prisma.cartoes.create({
      data: {
        userId: userId,
        nomeCartao: nome,
        bandeira: bandeira,
        instituicao: instituicao,
        tipoCartao: tipo,
        vencimento: tipo === "credito" ? vencimento ?? null : null,
        limite: tipo === "credito" ? parseFloat(limite as string) : null,
      },
    })

    console.log("Cartão criado com sucesso:", novoCartao)

    return res
      .status(201)
      .json({ message: "Cartão criado com sucesso", cartao: novoCartao })
  } catch (error: any) {
    console.error("Erro ao criar cartão:", error)

    if (error.code === "P2002") {
      console.log("Erro de duplicidade: Cartão já existe")
      return res.status(409).json({ message: "Conflito: Cartão já existe" })
    }

    return res.status(500).json({
      message: "Erro ao criar cartão",
      error: error?.message || "Erro desconhecido",
    })
  }
}
