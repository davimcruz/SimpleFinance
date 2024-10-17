import { NextApiRequest, NextApiResponse } from 'next'
import transactionsSummary from '@/pages/api/transactions/get-summary'
import { verifyToken } from '@/pages/api/middleware/jwt-auth'
import prisma from '@/lib/prisma'
import { parseCookies } from 'nookies'

jest.mock('@/pages/api/middleware/jwt-auth')
jest.mock('@/lib/prisma', () => ({
  transacoes: {
    findMany: jest.fn()
  }
}))
jest.mock('nookies')

type MockNextApiResponse = NextApiResponse & {
  status: jest.Mock;
  json: jest.Mock;
}

describe('transactionsSummary', () => {
  let mockReq: Partial<NextApiRequest>
  let mockRes: MockNextApiResponse

  beforeEach(() => {
    mockReq = { method: 'GET' }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as MockNextApiResponse
    ;(verifyToken as jest.Mock).mockResolvedValue(true)
    ;(parseCookies as jest.Mock).mockReturnValue({ userId: '1' })
  })

  it('should return 405 for non-GET requests', async () => {
    mockReq.method = 'POST'
    await transactionsSummary(mockReq as NextApiRequest, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(405)
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Método não permitido" })
  })

  it('should return 401 for invalid token', async () => {
    ;(verifyToken as jest.Mock).mockResolvedValue(false)
    await transactionsSummary(mockReq as NextApiRequest, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Não autorizado" })
  })

  it('should return 400 for invalid userId', async () => {
    ;(parseCookies as jest.Mock).mockReturnValue({ userId: 'invalid' })
    await transactionsSummary(mockReq as NextApiRequest, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({ error: "ID de usuário inválido" })
  })

  it('should calculate and return correct summary', async () => {
    const currentYear = new Date().getFullYear()
    const mockTransactions = [
      { data: `01-01-${currentYear}`, valor: 100, tipo: 'receita' },
      { data: `01-02-${currentYear}`, valor: 200, tipo: 'receita' },
      { data: `01-03-${currentYear}`, valor: 50, tipo: 'despesa' },
    ]
    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue(mockTransactions)

    await transactionsSummary(mockReq as NextApiRequest, mockRes)

    console.log('Mock status calls:', mockRes.status.mock.calls)
    console.log('Mock json calls:', mockRes.json.mock.calls)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      annualIncome: '300.00',
      annualExpense: '50.00',
      annualBalance: '250.00'
    })
  })

  it('should handle empty transactions', async () => {
    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue([])

    await transactionsSummary(mockReq as NextApiRequest, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      annualIncome: '0.00',
      annualExpense: '0.00',
      annualBalance: '0.00'
    })
  })

  it('should handle server error', async () => {
    ;(prisma.transacoes.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

    await transactionsSummary(mockReq as NextApiRequest, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Erro interno do servidor" })
  })

  it('should ignore invalid transaction types', async () => {
    const mockTransactions = [
      { data: '2023-01-01', valor: 100, tipo: 'receita' },
      { data: '2023-02-01', valor: 200, tipo: 'invalid' },
      { data: '2023-03-01', valor: 50, tipo: 'despesa' },
    ]
    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue(mockTransactions)

    await transactionsSummary(mockReq as NextApiRequest, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      annualIncome: '100.00',
      annualExpense: '50.00',
      annualBalance: '50.00'
    })
  })

  it('should handle invalid transaction values', async () => {
    const mockTransactions = [
      { data: '2023-01-01', valor: 100, tipo: 'receita' },
      { data: '2023-02-01', valor: 'invalid', tipo: 'receita' },
      { data: '2023-03-01', valor: 50, tipo: 'despesa' },
    ]
    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue(mockTransactions)

    await transactionsSummary(mockReq as NextApiRequest, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      annualIncome: '100.00',
      annualExpense: '50.00',
      annualBalance: '50.00'
    })
  })

  it('should calculate and return correct summary with high values', async () => {
    const currentYear = new Date().getFullYear()
    const mockTransactions = [
      { data: `01-01-${currentYear}`, valor: 1000000.50, tipo: 'receita' },
      { data: `01-02-${currentYear}`, valor: 2000000.75, tipo: 'receita' },
      { data: `01-03-${currentYear}`, valor: 1500000.25, tipo: 'despesa' },
    ]
    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue(mockTransactions)

    await transactionsSummary(mockReq as NextApiRequest, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      annualIncome: '3000001.25',
      annualExpense: '1500000.25',
      annualBalance: '1500001.00'
    })
  })

  it('should calculate and return correct summary with fractional values', async () => {
    const currentYear = new Date().getFullYear()
    const mockTransactions = [
      { data: `01-01-${currentYear}`, valor: 100.33, tipo: 'receita' },
      { data: `01-02-${currentYear}`, valor: 200.66, tipo: 'receita' },
      { data: `01-03-${currentYear}`, valor: 50.99, tipo: 'despesa' },
    ]
    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue(mockTransactions)

    await transactionsSummary(mockReq as NextApiRequest, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      annualIncome: '300.99',
      annualExpense: '50.99',
      annualBalance: '250.00'
    })
  })

  it('should handle very large numbers correctly', async () => {
    const currentYear = new Date().getFullYear()
    const mockTransactions = [
      { data: `01-01-${currentYear}`, valor: 9999999999.99, tipo: 'receita' },
      { data: `01-02-${currentYear}`, valor: 9999999999.99, tipo: 'receita' },
      { data: `01-03-${currentYear}`, valor: 9999999999.99, tipo: 'despesa' },
    ]
    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue(mockTransactions)

    await transactionsSummary(mockReq as NextApiRequest, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      annualIncome: '19999999999.98',
      annualExpense: '9999999999.99',
      annualBalance: '9999999999.99'
    })
  })

  it('should handle many small fractional values correctly', async () => {
    const currentYear = new Date().getFullYear()
    const mockTransactions = Array.from({ length: 1000 }, (_, i) => ({
      data: `01-01-${currentYear}`,
      valor: 0.01,
      tipo: i % 2 === 0 ? 'receita' : 'despesa'
    }))
    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue(mockTransactions)

    await transactionsSummary(mockReq as NextApiRequest, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      annualIncome: '5.00',
      annualExpense: '5.00',
      annualBalance: '0.00'
    })
  })
})
