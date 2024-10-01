import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "../Auth/jwtAuth"

const prisma = new PrismaClient()

const realocarSaldo = async (userId: number, anoAtual: number) => {
  console.log("Iniciando realocação de saldo...")

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

  const updates = orcamentos.map((mesAtual) => {
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

    if (saldoMes < 0) {
      saldoRealocado += saldoMes 
    } else {
      saldoRealocado += saldoMes 
    }

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

  await prisma.$transaction(updates)
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

  if (!transactionId || !nome || !tipo || !fonte || !data || !valor) {
    return res.status(400).json({ error: "Dados obrigatórios estão faltando" })
  }

  console.log("Transaction ID recebido:", transactionId)

  try {
    const valorFloat = typeof valor === "number" ? valor : parseFloat(valor)

    const extractedDate = data.split("T")[0]
    const formattedDate = extractedDate.split("-").reverse().join("-")

    const updatedTransaction = await prisma.transacoes.update({
      where: { transactionId },
      data: {
        nome,
        tipo,
        fonte,
        detalhesFonte: detalhesFonte || null,
        data: formattedDate || null,
        valor: valorFloat, 
      },
    })

    console.log("Transação atualizada com sucesso:", updatedTransaction)

    await realocarSaldo(updatedTransaction.userId, new Date().getFullYear())

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}

