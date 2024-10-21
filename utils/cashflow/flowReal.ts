import prisma from "@/lib/prisma"

export async function atualizarFluxoReal(userId: number) {
  const anoAtual = new Date().getFullYear()
  const mesAtual = new Date().getMonth() + 1

  const transacoes = await prisma.transacoes.findMany({
    where: {
      userId,
      data: {
        endsWith: `-${anoAtual}`,
      },
    },
    select: {
      tipo: true,
      valor: true,
      data: true,
    },
  })

  const totaisPorMes: { [key: number]: { receita: number; despesa: number } } = {}

  transacoes.forEach((transacao) => {
    if (transacao.data === null) return
    const [dia, mes, ano] = transacao.data.split('-').map(Number)
    if (ano !== anoAtual) return

    if (!totaisPorMes[mes]) {
      totaisPorMes[mes] = { receita: 0, despesa: 0 }
    }

    if (transacao.tipo === 'receita') {
      totaisPorMes[mes].receita += transacao.valor
    } else if (transacao.tipo === 'despesa') {
      totaisPorMes[mes].despesa += transacao.valor
    }
  })

  let saldoAnterior = 0
  const atualizacoes = []

  const mesesExistentes = await prisma.orcamento.findMany({
    where: {
      userId,
      ano: anoAtual,
    },
    select: {
      mes: true,
    },
    orderBy: {
      mes: 'asc',
    },
  })

  for (const { mes } of mesesExistentes) {
    const { receita = 0, despesa = 0 } = totaisPorMes[mes] || {}
    const saldoMesAtual = receita - despesa
    const saldoRealizado = saldoAnterior + saldoMesAtual

    atualizacoes.push(
      prisma.orcamento.update({
        where: {
          userId_mes_ano: {
            userId,
            mes,
            ano: anoAtual,
          },
        },
        data: {
          receitaRealizada: receita,
          despesaRealizada: despesa,
          saldoRealizado,
        },
      })
    )

    saldoAnterior = saldoRealizado
  }

  await prisma.$transaction(atualizacoes)

  const fluxoAtualizado = await prisma.orcamento.findMany({
    where: {
      userId,
      ano: anoAtual,
      mes: { gte: mesAtual },
    },
    orderBy: { mes: 'asc' },
  })

  return fluxoAtualizado
}
