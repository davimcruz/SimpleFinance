import { atualizarFluxoReal } from "../../../utils/cashflow/flowReal"
import { PrismaClient } from "@prisma/client"

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    transacoes: {
      findMany: jest.fn(),
    },
    orcamento: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const prisma = require("@/lib/prisma").default as jest.Mocked<PrismaClient>

describe("atualizarFluxoReal", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("deve calcular corretamente o fluxo real para um mês", async () => {
    const userId = 1
    const anoAtual = new Date().getFullYear()
    const mesAtual = new Date().getMonth() + 1

    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue([
      { tipo: "receita", valor: 1000, data: `01-${mesAtual.toString().padStart(2, '0')}-${anoAtual}` },
      { tipo: "despesa", valor: 500, data: `15-${mesAtual.toString().padStart(2, '0')}-${anoAtual}` },
    ])

    ;(prisma.orcamento.upsert as jest.Mock).mockResolvedValue({})

    const fluxoAtualizadoMock = [
      {
        mes: mesAtual,
        receitaRealizada: 1000,
        despesaRealizada: 500,
        saldoRealizado: 500,
      },
    ]
    ;(prisma.orcamento.findMany as jest.Mock).mockResolvedValue(fluxoAtualizadoMock)

    const resultado = await atualizarFluxoReal(userId)

    expect(prisma.orcamento.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        userId_mes_ano: {
          userId,
          mes: mesAtual,
          ano: anoAtual,
        },
      },
      update: {
        receitaRealizada: 1000,
        despesaRealizada: 500,
        saldoRealizado: 500,
      },
      create: expect.any(Object),
    }))

    expect(resultado).toEqual(fluxoAtualizadoMock)
  })

  it("deve lidar corretamente com múltiplos meses", async () => {
    const userId = 1
    const anoAtual = new Date().getFullYear()
    const mesAtual = new Date().getMonth() + 1

    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue([
      { tipo: "receita", valor: 1000, data: `01-${mesAtual.toString().padStart(2, '0')}-${anoAtual}` },
      { tipo: "despesa", valor: 500, data: `15-${mesAtual.toString().padStart(2, '0')}-${anoAtual}` },
      { tipo: "receita", valor: 1500, data: `01-${(mesAtual + 1).toString().padStart(2, '0')}-${anoAtual}` },
      { tipo: "despesa", valor: 700, data: `15-${(mesAtual + 1).toString().padStart(2, '0')}-${anoAtual}` },
    ])

    ;(prisma.orcamento.upsert as jest.Mock).mockResolvedValue({})

    const fluxoAtualizadoMock = [
      {
        mes: mesAtual,
        receitaRealizada: 1000,
        despesaRealizada: 500,
        saldoRealizado: 500,
      },
      {
        mes: mesAtual + 1,
        receitaRealizada: 1500,
        despesaRealizada: 700,
        saldoRealizado: 800,
      },
    ]
    ;(prisma.orcamento.findMany as jest.Mock).mockResolvedValue(fluxoAtualizadoMock)

    const resultado = await atualizarFluxoReal(userId)

    expect(prisma.orcamento.upsert).toHaveBeenCalledTimes(2)
    expect(resultado).toEqual(fluxoAtualizadoMock)
  })

  it("deve ignorar transações sem data", async () => {
    const userId = 1
    const anoAtual = new Date().getFullYear()
    const mesAtual = new Date().getMonth() + 1

    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue([
      { tipo: "receita", valor: 1000, data: null },
      { tipo: "receita", valor: 1500, data: `01-${mesAtual.toString().padStart(2, '0')}-${anoAtual}` },
    ])

    ;(prisma.orcamento.upsert as jest.Mock).mockResolvedValue({})

    const fluxoAtualizadoMock = [
      {
        mes: mesAtual,
        receitaRealizada: 1500,
        despesaRealizada: 0,
        saldoRealizado: 1500,
      },
    ]
    ;(prisma.orcamento.findMany as jest.Mock).mockResolvedValue(fluxoAtualizadoMock)

    const resultado = await atualizarFluxoReal(userId)

    expect(prisma.orcamento.upsert).toHaveBeenCalledTimes(1)
    expect(resultado).toEqual(fluxoAtualizadoMock)
  })

  it("deve lidar com o caso de nenhuma transação", async () => {
    const userId = 1

    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.orcamento.findMany as jest.Mock).mockResolvedValue([])

    const resultado = await atualizarFluxoReal(userId)

    expect(prisma.orcamento.upsert).not.toHaveBeenCalled()
    expect(resultado).toEqual([])
  })
})
