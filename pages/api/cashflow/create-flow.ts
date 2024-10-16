import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../middleware/jwt-auth"
import prisma from "@/lib/prisma"
import { createFlowSchema } from "@/lib/validation"
import { realocarFluxo } from "@/utils/flowUtils"
import Redis from "ioredis"
import { z } from "zod"

const redisUrl = process.env.REDIS_URL
const redisToken = process.env.REDIS_TOKEN

if (!redisUrl || !redisToken) {
  throw new Error("Variáveis de Ambiente não definidas")
}

const redis = new Redis(redisUrl, {
  password: redisToken,
  maxRetriesPerRequest: 10,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  reconnectOnError: (err) => {
    const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"]
    if (targetErrors.some((targetError) => err.message.includes(targetError))) {
      return true
    }
    return false
  },
})

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

    const parsedBody = createFlowSchema.safeParse(req.body)

    if (!parsedBody.success) {
      console.log("Erro de validação:", parsedBody.error.flatten().fieldErrors)
      return res.status(400).json({
        message: "Dados inválidos",
        errors: parsedBody.error.flatten().fieldErrors,
      })
    }

    const { userId, flow } = parsedBody.data
    const anoAtual = new Date().getFullYear()
    const mesAtual = new Date().getMonth() + 1

    const existingFlow = await prisma.orcamento.findFirst({
      where: {
        userId,
        ano: anoAtual,
      },
    })

    if (existingFlow) {
      return res.status(409).json({
        message: "Fluxo de caixa já existente",
        error: "Já existe um fluxo de caixa para este usuário neste ano.",
        code: "EXISTING_FLOW",
        year: anoAtual,
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

    const cacheKey = `userFlow:${userId}:${anoAtual}`
    await redis.set(cacheKey, JSON.stringify(fluxoRealocado), 'EX', 3600) 
    console.log(`Cache atualizado para a chave: ${cacheKey}`)

    return res.status(201).json({
      message: "Cash flow criado e realocado com sucesso",
      flowPlanejado: fluxoRealocado,
    })
  } catch (error) {
    console.error("Erro ao criar e realocar cash flow:", error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Dados inválidos",
        errors: error.errors,
      })
    }

    return res.status(500).json({
      message: "Erro ao criar e realocar cash flow",
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    })
  }
}
