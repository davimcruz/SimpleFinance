import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../auth/jwt-auth"

import prisma from "@/lib/prisma"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ message: "Não autorizado" })
  }

  const { userId, orcamentoAnualPorMes } = req.body

  if (!userId || !orcamentoAnualPorMes || orcamentoAnualPorMes.length !== 12) {
    return res.status(400).json({ message: "Informações inválidas" })
  }

  const userIdNumber = Number(userId)
  if (isNaN(userIdNumber)) {
    return res.status(400).json({ message: "UserId inválido" })
  }

  const allPositive = orcamentoAnualPorMes.every((valor: number) => valor > 0)
  if (!allPositive) {
    return res
      .status(400)
      .json({ message: "Todos os valores devem ser positivos" })
  }

  try {
    const anoAtual = new Date().getFullYear()

    const existingOrcamento = await prisma.orcamento.findFirst({
      where: {
        userId: userIdNumber,
        ano: anoAtual,
      },
    })

    if (existingOrcamento) {
      return res
        .status(400)
        .json({ message: "Já existe um orçamento para o ano atual." })
    }

    await prisma.$transaction(async (prisma) => {
      const orcamentoData = orcamentoAnualPorMes.map(
        (valor: number, index: number) => ({
          userId: userIdNumber,
          mes: index + 1,
          valor,
          ano: anoAtual,
        })
      )

      await prisma.orcamento.createMany({
        data: orcamentoData,
      })
    })

    return res.status(201).json({
      message: "Orçamento criado com sucesso",
      userId: userIdNumber,
      valoresMensais: orcamentoAnualPorMes,
    })
  } catch (error) {
    console.error("Erro ao criar orçamento:", error)
    return res.status(500).json({
      message: "Erro ao criar orçamento",
      error: (error as Error).message,
    })
  }
}
