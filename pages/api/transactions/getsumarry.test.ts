import { createMocks } from "node-mocks-http"
import transactionsSummary from "./get-summary"
import prisma from "@/lib/prisma"
import { verifyToken } from "../middleware/jwt-auth"

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    transacoes: {
      findMany: jest.fn(), 
    },
  },
}))
jest.mock("../middleware/jwt-auth")

describe("Transactions Summary API - Teste com muitas entradas", () => {
  afterEach(() => {
    jest.clearAllMocks() 
  })

  it("deve processar corretamente um grande número de transações", async () => {
    ;(verifyToken as jest.Mock).mockResolvedValue(true)

    const mockTransactions = Array.from({ length: 10000 }, (_, i) => ({
      valor: (Math.random() * 100).toFixed(2), 
      tipo: i % 2 === 0 ? "receita" : "despesa",
      data: `2023-10-${String((i % 30) + 1).padStart(2, "0")}`, 
    }))

    console.log("Simulando transações:", mockTransactions.slice(0, 50)) 

    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue(
      mockTransactions
    )

    const { req, res } = createMocks({
      method: "GET",
      headers: {
        cookie: "userId=1", 
      },
    })

    console.log("Requisição criada:", req)

    await transactionsSummary(req, res)

    const result = JSON.parse(res._getData())

    console.log("Resultado retornado:", result) 

    expect(res._getStatusCode()).toBe(200)
    expect(result.totalIncomeThisMonth).toBeDefined()
    expect(result.totalExpenseThisMonth).toBeDefined()
    expect(result.balanceThisMonth).toBeDefined()
  })
})
