import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../middleware/jwt-auth"
import prisma from "@/lib/prisma"
import { updateFlowSchema } from "@/lib/validation"
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
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  try {
    if (!await verifyToken({ req } as any)) {
      return res.status(401).json({ message: "Não autorizado" })
    }

    const parsedBody = updateFlowSchema.safeParse(req.body)

    if (!parsedBody.success) {
      console.log("Erro de validação:", parsedBody.error.flatten().fieldErrors)
      return res.status(400).json({
        message: "Dados inválidos",
        errors: parsedBody.error.flatten().fieldErrors,
      })
    }

    const { userId, flow } = parsedBody.data
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

    const cacheKeyFlow = `userFlow:${userId}:${anoAtual}`
    await redis.del(cacheKeyFlow)
    console.log(`Cache invalidado para a chave: ${cacheKeyFlow}`)

    await redis.set(cacheKeyFlow, JSON.stringify(fluxoRealocado), 'EX', 3600) 
    console.log(`Cache atualizado para a chave: ${cacheKeyFlow}`)
  
    const mesAtual = new Date().getMonth() + 1
    const cacheKeyMonthly = `userMonthly:${userId}:${anoAtual}:${mesAtual}`
    const saldoMesAtual = fluxoRealocado.find(f => f.mes === mesAtual)?.saldo ?? 0
    await redis.set(cacheKeyMonthly, saldoMesAtual.toString(), 'EX', 3600)
    console.log(`Cache atualizado para a chave: ${cacheKeyMonthly}`)

    return res.status(200).json({
      message: "Cash flow atualizado e realocado com sucesso",
      flowAtualizado: fluxoRealocado,
    })
  } catch (error) {
    console.error("Erro ao atualizar e realocar cash flow:", error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Dados inválidos",
        errors: error.errors,
      })
    }

    return res.status(500).json({
      message: "Erro ao atualizar e realocar cash flow",
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    })
  }
}
