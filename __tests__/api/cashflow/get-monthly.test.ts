import { createMocks } from "node-mocks-http"
import handler from "@/pages/api/cashflow/get-monthly"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/pages/api/middleware/jwt-auth"

jest.mock("@/lib/prisma", () => ({
  orcamento: {
    findUnique: jest.fn(),
  },
}))

jest.mock("@/pages/api/middleware/jwt-auth", () => ({
  verifyToken: jest.fn(),
}))

describe("/api/cashflow/get-monthly", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  it("deve retornar o saldo do mês atual corretamente", async () => {
    const mockOrcamento = {
      saldo: 1000.5,
    }

    const { req, res } = createMocks({
      method: "GET",
      query: {
        userId: "1",
      },
    })

    ;(verifyToken as jest.Mock).mockResolvedValue(true)
    ;(prisma.orcamento.findUnique as jest.Mock).mockResolvedValue(mockOrcamento)

    const mockDate = new Date(2023, 9, 15)
    jest.spyOn(global, "Date").mockImplementation(() => mockDate)

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const responseData = JSON.parse(res._getData())
    expect(responseData).toEqual({
      message: "Saldo do mês atual obtido com sucesso",
      saldo: 1000.5,
      mesAtual: "Outubro",
    })

    expect(prisma.orcamento.findUnique).toHaveBeenCalledWith({
      where: {
        userId_mes_ano: {
          userId: 1,
          mes: 10,
          ano: 2023,
        },
      },
      select: {
        saldo: true,
      },
    })
  })

  it("deve retornar erro 404 quando não encontrar orçamento", async () => {
    const { req, res } = createMocks({
      method: "GET",
      query: {
        userId: "1",
      },
    })

    ;(verifyToken as jest.Mock).mockResolvedValue(true)
    ;(prisma.orcamento.findUnique as jest.Mock).mockResolvedValue(null)

    await handler(req, res)

    expect(res._getStatusCode()).toBe(404)
    expect(JSON.parse(res._getData())).toEqual({
      message: "Orçamento não encontrado para o mês atual",
    })
  })

  it("deve retornar erro 401 para token inválido", async () => {
    const { req, res } = createMocks({
      method: "GET",
      query: {
        userId: "1",
      },
    })

    ;(verifyToken as jest.Mock).mockResolvedValue(false)

    await handler(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(JSON.parse(res._getData())).toEqual({
      message: "Não autorizado",
    })
  })

  it("deve retornar erro 400 para userId inválido", async () => {
    const { req, res } = createMocks({
      method: "GET",
      query: {
        userId: "invalid",
      },
    })

    ;(verifyToken as jest.Mock).mockResolvedValue(true)

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      message: "UserId não fornecido ou inválido",
    })
  })

  it("deve retornar erro 405 para método não permitido", async () => {
    const { req, res } = createMocks({
      method: "POST",
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      message: "Método não permitido",
    })
  })

  it("deve lidar com erro interno do servidor", async () => {
    const { req, res } = createMocks({
      method: "GET",
      query: {
        userId: "1",
      },
    })

    ;(verifyToken as jest.Mock).mockResolvedValue(true)
    ;(prisma.orcamento.findUnique as jest.Mock).mockRejectedValue(
      new Error("Erro de banco de dados")
    )

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      message: "Erro ao obter saldo",
      error: "Erro de banco de dados",
    })
    expect(console.error).toHaveBeenCalledWith(
      "Erro ao obter saldo:",
      expect.any(Error)
    )
  })
})
