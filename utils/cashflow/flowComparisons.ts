import prisma from "@/lib/prisma"

export async function compararFluxos(userId: number) {
  const anoAtual = new Date().getFullYear()
  const mesAtual = new Date().getMonth() + 1

  const orcamentos = await prisma.orcamento.findMany({
    where: {
      userId,
      ano: anoAtual,
    },
    orderBy: {
      mes: 'asc',
    },
  })

  const atualizacoes = orcamentos.map((orcamento) => {
    const gapMoney = (orcamento.saldoRealizado || 0) - (orcamento.saldoOrcado || 0)
    let gapPercentage = 0
    let status = 'neutro'

    if (orcamento.saldoOrcado !== 0) {
      gapPercentage = (gapMoney / Math.abs(orcamento.saldoOrcado as number))
    }

    if (gapMoney > 0) {
      status = 'excedente'
    } else if (gapMoney < 0) {
      status = 'deficit'
    }

    return prisma.orcamento.update({
      where: {
        userId_mes_ano: {
          userId: orcamento.userId,
          mes: orcamento.mes,
          ano: orcamento.ano,
        },
      },
      data: {
        gapMoney,
        gapPercentage,
        status,
      },
    })
  })

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

