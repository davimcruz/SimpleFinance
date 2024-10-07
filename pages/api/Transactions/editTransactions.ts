import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../auth/middleware-jwt-auth"
import prisma from "@/lib/prisma"
import Redis from "ioredis"

const redisUrl = process.env.REDIS_URL
const redisToken = process.env.REDIS_TOKEN

if (!redisUrl || !redisToken) {
  throw new Error(
    "Variáveis de Ambiente REDIS_URL e REDIS_TOKEN não estão definidas."
  )
}

const redis = new Redis(redisUrl, {
  password: redisToken,
  maxRetriesPerRequest: 5,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000)
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

const realocarSaldo = async (userId: number, anoAtual: number) => {
  const orcamentos = await prisma.orcamento.findMany({
    where: { userId, ano: anoAtual },
    orderBy: { mes: "asc" },
  })

  const transacoes = await prisma.transacoes.findMany({
    where: {
      userId,
      data: {
        contains: `-${anoAtual}`,
      },
    },
  })

  const transacoesPorMes = transacoes.reduce((acc, transacao) => {
    const mes = parseInt(transacao.data?.split("-")[1] || "0", 10)
    const valor = parseFloat(
      String(transacao.valor)?.replace("R$", "").replace(",", ".").trim() || "0"
    )

    if (!acc[mes]) {
      acc[mes] = { receita: 0, despesa: 0 }
    }

    if (transacao.tipo === "receita") {
      acc[mes].receita += valor
    } else if (transacao.tipo === "despesa") {
      acc[mes].despesa += valor
    }

    return acc
  }, {} as Record<number, { receita: number; despesa: number }>)

  let saldoRealocadoAnterior = 0
  const mesAtualNumero = new Date().getMonth() + 1

  const updates = orcamentos.map(async (mesAtual) => {
    const transacoesMes = transacoesPorMes[mesAtual.mes] || {
      receita: 0,
      despesa: 0,
    }
    const saldoMes = transacoesMes.receita - transacoesMes.despesa

    let statusMes = "padrao"

    if (mesAtual.mes > mesAtualNumero) {
      statusMes = "futuro"
    } else {
      if (saldoMes > 0) statusMes = "excedente"
      else if (saldoMes < 0) statusMes = "deficit"
      else statusMes = "padrao"
    }

    let saldoRealocado = saldoRealocadoAnterior

    saldoRealocado += saldoMes

    console.log(
      `Mês ${mesAtual.mes}: Receita: ${transacoesMes.receita}, Despesa: ${transacoesMes.despesa}, Saldo Mês: ${saldoMes}, Saldo Realocado Anterior: ${saldoRealocadoAnterior}, Saldo Realocado Atual: ${saldoRealocado}`
    )

    saldoRealocadoAnterior = saldoRealocado

    console.log(`Atualizando saldo realocado para o mês ${mesAtual.mes}...`)

    return prisma.orcamento.update({
      where: {
        userId_mes_ano: {
          userId: mesAtual.userId,
          mes: mesAtual.mes,
          ano: mesAtual.ano,
        },
      },
      data: {
        saldoRealocado: saldoRealocado,
        status: statusMes,
      },
    })
  })

  await Promise.all(updates)
  console.log("Realocação de saldo concluída.")
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Recebendo requisição:", req.method, req.body)

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ error: "Não autorizado" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { nome, tipo, fonte, detalhesFonte, data, valor, transactionId } =
    req.body

  if (!transactionId) {
    return res.status(400).json({ error: "transactionId é obrigatório" })
  }

  try {
    const currentTransaction = await prisma.transacoes.findUnique({
      where: { transactionId },
      include: {
        parcelas: true,
      },
    })

    if (!currentTransaction) {
      return res.status(404).json({ error: "Transação não encontrada" })
    }

    const updates: any = {}

    if (nome && nome !== currentTransaction.nome) {
      updates.nome = nome
    }

    if (tipo && tipo !== currentTransaction.tipo) {
      updates.tipo = tipo
    }

    if (fonte && fonte !== currentTransaction.fonte) {
      updates.fonte = fonte
    }

    if (
      detalhesFonte !== undefined &&
      detalhesFonte !== currentTransaction.detalhesFonte
    ) {
      updates.detalhesFonte = detalhesFonte || null
    }

    if (data && data !== currentTransaction.data) {
      const extractedDate = data.split("T")[0]
      const formattedDate = extractedDate.split("-").reverse().join("-")
      updates.data = formattedDate || null
    }

    if (
      valor !== undefined &&
      valor !== null &&
      valor !== currentTransaction.valor
    ) {
      const valorFloat = typeof valor === "number" ? valor : parseFloat(valor)
      updates.valor = valorFloat

      if (currentTransaction.numeroParcelas) {
        const valorParcelaNovo = valorFloat / currentTransaction.numeroParcelas

        await prisma.parcelas.updateMany({
          where: { transacaoId: transactionId },
          data: {
            valorParcela: valorParcelaNovo,
          },
        })

        const faturaIds = currentTransaction.parcelas
          .map((parcela) => parcela.faturaId)
          .filter((id): id is string => id !== null)

        const faturasAtualizadas = await prisma.faturas.findMany({
          where: { faturaId: { in: faturaIds } },
        })

        for (const fatura of faturasAtualizadas) {
          const totalParcelas = await prisma.parcelas.findMany({
            where: { faturaId: fatura.faturaId },
          })

          const novoValorTotal = totalParcelas.reduce(
            (acc, parcela) => acc + parcela.valorParcela,
            0
          )

          await prisma.faturas.update({
            where: { faturaId: fatura.faturaId },
            data: { valorTotal: novoValorTotal },
          })
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(200).json({ message: "Nenhuma alteração detectada" })
    }

    const updatedTransaction = await prisma.transacoes.update({
      where: { transactionId },
      data: updates,
    })

    console.log("Transação atualizada com sucesso:", updatedTransaction)

    const cacheKey = `transactions:user:${updatedTransaction.userId}`
    await redis.del(cacheKey)

    realocarSaldo(updatedTransaction.userId, new Date().getFullYear()).catch(
      (err) => console.error("Erro ao realocar saldo:", err)
    )

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
