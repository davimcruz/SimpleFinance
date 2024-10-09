import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../middleware/jwt-auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const updateBudgetSchema = z.object({
  userId: z.number().int().positive(),
  mes: z.number().int().min(1).max(12),
  valor: z.number().positive(),
  ano: z.number().int().positive(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ message: "Não autorizado" })
  }

  try {
    const validatedData = updateBudgetSchema.parse(req.body)
    const { userId, mes, valor, ano } = validatedData

    const existingBudget = await prisma.orcamento.findUnique({
      where: {
        userId_mes_ano: {
          userId,
          mes,
          ano,
        },
      },
    })

    if (!existingBudget) {
      const newBudget = await prisma.orcamento.create({
        data: {
          userId,
          mes,
          ano,
          valor,
        },
      })

      return res.status(201).json({
        message: "Novo orçamento criado com sucesso",
        budget: newBudget,
      })
    }

    const updatedBudget = await prisma.orcamento.update({
      where: {
        userId_mes_ano: {
          userId,
          mes,
          ano,
        },
      },
      data: {
        valor,
      },
    })

    return res.status(200).json({
      message: "Orçamento atualizado com sucesso",
      budget: updatedBudget,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Dados inválidos", errors: error.errors })
    }

    console.error("Erro ao atualizar orçamento:", error)
    return res.status(500).json({
      message: "Erro ao atualizar orçamento",
      error: (error as Error).message,
    })
  }
}
