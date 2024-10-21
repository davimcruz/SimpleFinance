import { NextApiRequest, NextApiResponse } from "next"

import { verifyToken } from "../middleware/jwt-auth"

import prisma from "@/lib/prisma"

import { monthNames } from "@/utils/monthNames"

import Redis from "ioredis"

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
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  try {
    if (!await verifyToken({ req } as any)) {
      return res.status(401).json({ message: "Não autorizado" })
    }

    const userId = parseUserId(req.query.userId)
    if (userId === null) {
      return res.status(400).json({ message: "UserId não fornecido ou inválido" })
    }

    const { anoAtual, mesAtual } = getCurrentDateInfo()
    
    const cacheKey = `userMonthly:${userId}:${anoAtual}:${mesAtual}`
    const cachedSaldo = await redis.get(cacheKey)

    let saldoOrcado: number
    if (cachedSaldo !== null) {
      saldoOrcado = Number(cachedSaldo)
      console.log(`Saldo orçado obtido do cache para a chave: ${cacheKey}`)
    } else {
      const orcamentoMesAtual = await getOrcamentoMesAtual(userId, anoAtual, mesAtual)

      if (!orcamentoMesAtual) {
        return res.status(404).json({
          message: "Orçamento não encontrado para o mês atual",
        })
      }

      saldoOrcado = orcamentoMesAtual.saldoOrcado ?? 0
      
      await redis.set(cacheKey, saldoOrcado.toString(), 'EX', 3600)
      console.log(`Cache atualizado para a chave: ${cacheKey}`)
    }

    const mesAtualNome = monthNames[mesAtual - 1] ?? 'Desconhecido'

    return res.status(200).json({
      message: "Saldo orçado do mês atual obtido com sucesso",
      saldoOrcado: Number(saldoOrcado.toFixed(2)),
      mesAtual: mesAtualNome,
    })
  } catch (error) {
    console.error("Erro ao obter saldo:", error)
    return res.status(500).json({
      message: "Erro ao obter saldo",
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    })
  }
}

function parseUserId(userId: string | string[] | undefined): number | null {
  if (!userId || Array.isArray(userId)) return null
  const parsed = Number(userId)
  return isNaN(parsed) ? null : parsed
}

function getCurrentDateInfo(): { anoAtual: number; mesAtual: number } {
  const now = new Date()
  return {
    anoAtual: now.getFullYear(),
    mesAtual: now.getMonth() + 1  
  }
}

async function getOrcamentoMesAtual(userId: number, ano: number, mes: number) {
  return prisma.orcamento.findUnique({
    where: {
      userId_mes_ano: {
        userId,
        mes,
        ano,
      }
    },
    select: {
      saldoOrcado: true,
    },
  })
}
