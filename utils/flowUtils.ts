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
    const receita = mes.receita ?? 0
    const despesa = mes.despesa ?? 0
    const novoSaldo = Number((saldoAnterior + (receita - despesa)).toFixed(2))
    
    let status: 'deficit' | 'excedente' | 'neutro'
    if (novoSaldo < 0) {
      status = 'deficit'
    } else if (novoSaldo > 0) {
      status = 'excedente'
    } else {
      status = 'neutro'
    }

    const mesAtualizado = {
      ...mes,
      saldo: novoSaldo,
      status: status,
    }
    saldoAnterior = novoSaldo
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
          saldo: mes.saldo,
          status: mes.status,
        },
      })
    )
  )

  return fluxoRealocado
}
