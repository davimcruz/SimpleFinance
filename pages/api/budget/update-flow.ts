import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../middleware/jwt-auth"
import prisma from "@/lib/prisma"
import { updateFlowSchema } from "@/lib/validation"
import { realocarFluxo } from "@/utils/flowUtils"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  try {
    if (!await verifyToken({ req } as any)) {
      return res.status(401).json({ message: "Não autorizado" })
    }

    const { userId, flow } = updateFlowSchema.parse(req.body)
    const anoAtual = new Date().getFullYear()

    const existingFlow = await prisma.orcamento.findFirst({
      where: {
        userId,
        ano: anoAtual,
      },
    })

    if (!existingFlow) {
      return res.status(404).json({
        message: "Não existe um cash flow para este usuário neste ano",
      })
    }

    await prisma.$transaction(
      Object.entries(flow).map(([mes, { receitaOrcada, despesaOrcada }]) =>
        prisma.orcamento.update({
          where: {
            userId_mes_ano: {
              userId,
              mes: Number(mes),
              ano: anoAtual,
            },
          },
          data: {
            receita: receitaOrcada,
            despesa: despesaOrcada,
          },
        })
      )
    )

    const fluxoRealocado = await realocarFluxo(userId)

    return res.status(200).json({
      message: "Cash flow atualizado e realocado com sucesso",
      flowAtualizado: fluxoRealocado,
    })
  } catch (error) {
    console.error("Erro ao atualizar e realocar cash flow:", error)
    return res.status(error instanceof Error && error.name === 'ZodError' ? 400 : 500).json({
      message: error instanceof Error && error.name === 'ZodError' ? "Erro de validação" : "Erro ao atualizar e realocar cash flow",
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    })
  }
}
