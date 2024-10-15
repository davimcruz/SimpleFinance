import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../middleware/jwt-auth"
import prisma from "@/lib/prisma"
import { createFlowSchema } from "@/lib/validation"
import { realocarFluxo } from "@/utils/flowUtils"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  try {
    if (!await verifyToken({ req } as any)) {
      return res.status(401).json({ message: "Não autorizado" })
    }

    const { userId, flow } = createFlowSchema.parse(req.body)
    const anoAtual = new Date().getFullYear()
    const mesAtual = new Date().getMonth() + 1

    const existingFlow = await prisma.orcamento.findFirst({
      where: {
        userId,
        ano: anoAtual,
      },
    })

    if (existingFlow) {
      return res.status(400).json({
        message: "Já existe um cash flow para este usuário neste ano",
      })
    }

    const validMonths = Object.entries(flow).filter(([mes]) => Number(mes) >= mesAtual)

    if (validMonths.length === 0) {
      return res.status(400).json({
        message: "Nenhum mês válido fornecido para o cash flow",
      })
    }

    const flowData = validMonths.map(([mes, { receitaOrcada, despesaOrcada }]) => ({
      userId,
      mes: Number(mes),
      ano: anoAtual,
      receita: receitaOrcada,
      despesa: despesaOrcada,
      saldo: 0,
      status: 'neutro',
    }))

    await prisma.orcamento.createMany({ data: flowData })

    const fluxoRealocado = await realocarFluxo(userId)

    return res.status(201).json({
      message: "Cash flow criado e realocado com sucesso",
      flowPlanejado: fluxoRealocado,
    })
  } catch (error) {
    console.error("Erro ao criar e realocar cash flow:", error)
    return res.status(error instanceof Error && error.name === 'ZodError' ? 400 : 500).json({
      message: error instanceof Error && error.name === 'ZodError' ? "Erro de validação" : "Erro ao criar e realocar cash flow",
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    })
  }
}