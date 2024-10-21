import prisma from "@/lib/prisma"

export async function realocarFluxo(userId: number) {
  const anoAtual = new Date().getFullYear()
  const mesAtual = new Date().getMonth() + 1 

  const fluxoAtual = await prisma.orcamento.findMany({
    where: {
      userId,
      ano: anoAtual,
      mes: { gte: mesAtual },
    },
    orderBy: { mes: "asc" },
  })

  if (fluxoAtual.length === 0) {
    throw new Error("Fluxo de caixa não encontrado")
  }

  let saldoAnterior = 0
  const fluxoRealocado = fluxoAtual.map((mes) => {
    const receitaOrcada = mes.receitaOrcada ?? 0
    const despesaOrcada = mes.despesaOrcada ?? 0
    const novoSaldoOrcado = Number((saldoAnterior + (receitaOrcada - despesaOrcada)).toFixed(2))
    
    let status: 'deficit' | 'excedente' | 'neutro'
    if (novoSaldoOrcado < 0) {
      status = 'deficit'
    } else if (novoSaldoOrcado > 0) {
      status = 'excedente'
    } else {
      status = 'neutro'
    }

    const mesAtualizado = {
      ...mes,
      saldoOrcado: novoSaldoOrcado,
      status: status,
    }
    saldoAnterior = novoSaldoOrcado
    return mesAtualizado
  })

  await prisma.$transaction(
    fluxoRealocado.map((mes) =>
      prisma.orcamento.update({
        where: {
          userId_mes_ano: {
            userId: mes.userId,
            mes: mes.mes,
            ano: mes.ano,
          },
        },
        data: {
          saldoOrcado: mes.saldoOrcado,
          status: mes.status,
        },
      })
    )
  )

  return fluxoRealocado
}
