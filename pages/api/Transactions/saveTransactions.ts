import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"
import { verifyToken } from "../Auth/jwtAuth"

const prisma = new PrismaClient()

const realocarSaldo = async (userId: number, anoAtual: number) => {
  console.log("Iniciando realocação de saldo...")

  const orcamentos = await prisma.orcamento.findMany({
    where: { userId, ano: anoAtual },
    orderBy: { mes: "asc" },
  })
  console.log(`Orçamentos encontrados: ${orcamentos.length}`)

  const transacoes = await prisma.transacoes.findMany({
    where: {
      userId,
      data: {
        contains: `-${anoAtual}`,
      },
    },
  })
  console.log(`Transações encontradas: ${transacoes.length}`)

  const transacoesPorMes = transacoes.reduce((acc, transacao) => {
    const mes = parseInt(transacao.data?.split("-")[1] || "0", 10)

    const valor = transacao.valor ?? 0

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
  const updates = orcamentos.map((mesAtual) => {
    const transacoesMes = transacoesPorMes[mesAtual.mes] || {
      receita: 0,
      despesa: 0,
    }
    const saldoMes = transacoesMes.receita - transacoesMes.despesa

    let statusMes = "padrao"
    if (saldoMes > 0) statusMes = "excedente"
    else if (saldoMes < 0) statusMes = "deficit"

    const saldoRealocado = saldoMes + saldoRealocadoAnterior
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
    console.log("Token inválido.")
    return res.status(401).json({ error: "Não autorizado" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { email, nome, tipo, fonte, detalhesFonte, data, valor } = req.body

  if (!email || !nome || !tipo || !fonte || !data || valor === undefined) {
    console.log("Dados obrigatórios estão faltando:", req.body)
    return res.status(400).json({ error: "Dados obrigatórios estão faltando" })
  }

  console.log("Email recebido:", email)

  try {
    console.log("Buscando ID do usuário no banco...")
    const user = await prisma.usuarios.findUnique({
      where: { email },
    })

    if (!user) {
      console.log("Usuário não encontrado")
      return res.status(404).json({ error: "Usuário não encontrado" })
    }

    const userId = user.id
    console.log("ID do usuário encontrado:", userId)

    const transactionId = uuidv4()

    const extractedDate = data.split("T")[0]
    const formattedDate = extractedDate.split("-").reverse().join("-")

    const valorFloat = valor

    console.log("Salvando transação no banco de dados...")
    await Promise.all([
      prisma.transacoes
        .create({
          data: {
            transactionId,
            userId,
            nome,
            tipo,
            fonte,
            detalhesFonte: detalhesFonte || null,
            data: formattedDate || null,
            valor: valorFloat,
          },
        })
        .then(() => console.log("Transação salva com sucesso."))
        .catch((error) => {
          console.error("Erro ao salvar transação:", error)
          throw error
        }),
      realocarSaldo(userId, new Date().getFullYear()).catch((error) => {
        console.error("Erro ao realocar saldo:", error)
        throw error
      }),
    ])

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
