import { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/transactions/get-summary'
import { verifyToken } from '@/pages/api/middleware/jwt-auth'
import prisma from '@/lib/prisma'
import { parseCookies } from 'nookies'

jest.mock('@/pages/api/middleware/jwt-auth')
jest.mock('@/lib/prisma', () => ({
  transacoes: {
    findMany: jest.fn(),
  },
}))
jest.mock('nookies')

describe('transactionsSummary', () => {
  let mockReq: Partial<NextApiRequest>
  let mockRes: Partial<NextApiResponse>
  let mockJson: jest.Mock
  let mockStatus: jest.Mock
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
  const currentMonthName = monthNames[parseInt(currentMonth) - 1]

  beforeEach(() => {
    mockJson = jest.fn()
    mockStatus = jest.fn().mockReturnThis()
    mockRes = {
      json: mockJson,
      status: mockStatus,
    }
    mockReq = {
      method: 'GET',
    }
    ;(verifyToken as jest.Mock).mockResolvedValue(true)
    ;(parseCookies as jest.Mock).mockReturnValue({ userId: '1' })
  })

  it('should return 405 for non-GET requests', async () => {
    mockReq.method = 'POST'
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse)
    expect(mockStatus).toHaveBeenCalledWith(405)
    expect(mockJson).toHaveBeenCalledWith({ error: "Método não permitido" })
  })

  it('should return 401 for invalid token', async () => {
    ;(verifyToken as jest.Mock).mockResolvedValue(false)
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse)
    expect(mockStatus).toHaveBeenCalledWith(401)
    expect(mockJson).toHaveBeenCalledWith({ error: "Não autorizado" })
  })

  it('should return 400 for invalid userId', async () => {
    ;(parseCookies as jest.Mock).mockReturnValue({ userId: 'invalid' })
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse)
    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({ error: "ID de usuário inválido" })
  })

  it('should calculate and return correct summary', async () => {
    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue([
      { data: `01-${currentMonth}-${currentYear}`, valor: 100, tipo: 'receita' },
      { data: `15-${currentMonth}-${currentYear}`, valor: 50, tipo: 'despesa' },
      { data: '01-01-2024', valor: 200, tipo: 'receita' },
    ])

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse)

    expect(mockStatus).toHaveBeenCalledWith(200)
    expect(mockJson).toHaveBeenCalledWith({
      annualIncome: '300.00',
      annualIncomeMessage: `Total de receitas para o ano de ${currentYear}`,
      annualExpense: '50.00',
      annualExpenseMessage: `Total de despesas para o ano de ${currentYear}`,
      annualBalance: '250.00',
      annualBalanceMessage: `Saldo total para o ano de ${currentYear}`,
      monthlyIncome: '100.00',
      monthlyIncomeMessage: `Total de receitas para o mês de ${currentMonthName}`,
      monthlyExpense: '50.00',
      monthlyExpenseMessage: `Total de despesas para o mês de ${currentMonthName}`,
      monthlyBalance: '50.00',
      monthlyBalanceMessage: `Saldo total para o mês de ${currentMonthName}`,
    })
  })

  it('should handle empty transactions', async () => {
    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue([])

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse)

    expect(mockStatus).toHaveBeenCalledWith(200)
    expect(mockJson).toHaveBeenCalledWith({
      annualIncome: '0.00',
      annualIncomeMessage: `Total de receitas para o ano de ${currentYear}`,
      annualExpense: '0.00',
      annualExpenseMessage: `Total de despesas para o ano de ${currentYear}`,
      annualBalance: '0.00',
      annualBalanceMessage: `Saldo total para o ano de ${currentYear}`,
      monthlyIncome: '0.00',
      monthlyIncomeMessage: `Total de receitas para o mês de ${currentMonthName}`,
      monthlyExpense: '0.00',
      monthlyExpenseMessage: `Total de despesas para o mês de ${currentMonthName}`,
      monthlyBalance: '0.00',
      monthlyBalanceMessage: `Saldo total para o mês de ${currentMonthName}`,
    })
  })

  it('should ignore invalid transaction types', async () => {
    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue([
      { data: `01-${currentMonth}-${currentYear}`, valor: 100, tipo: 'receita' },
      { data: `15-${currentMonth}-${currentYear}`, valor: 50, tipo: 'despesa' },
      { data: `20-${currentMonth}-${currentYear}`, valor: 75, tipo: 'invalido' },
    ])

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse)

    expect(mockStatus).toHaveBeenCalledWith(200)
    expect(mockJson).toHaveBeenCalledWith({
      annualIncome: '100.00',
      annualIncomeMessage: `Total de receitas para o ano de ${currentYear}`,
      annualExpense: '50.00',
      annualExpenseMessage: `Total de despesas para o ano de ${currentYear}`,
      annualBalance: '50.00',
      annualBalanceMessage: `Saldo total para o ano de ${currentYear}`,
      monthlyIncome: '100.00',
      monthlyIncomeMessage: `Total de receitas para o mês de ${currentMonthName}`,
      monthlyExpense: '50.00',
      monthlyExpenseMessage: `Total de despesas para o mês de ${currentMonthName}`,
      monthlyBalance: '50.00',
      monthlyBalanceMessage: `Saldo total para o mês de ${currentMonthName}`,
    })
  })

  it('should handle invalid transaction values', async () => {
    ;(prisma.transacoes.findMany as jest.Mock).mockResolvedValue([
      { data: `01-${currentMonth}-${currentYear}`, valor: 100, tipo: 'receita' },
      { data: `15-${currentMonth}-${currentYear}`, valor: 'invalid', tipo: 'despesa' },
    ])

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse)

    expect(mockStatus).toHaveBeenCalledWith(200)
    expect(mockJson).toHaveBeenCalledWith({
      annualIncome: '100.00',
      annualIncomeMessage: `Total de receitas para o ano de ${currentYear}`,
      annualExpense: '0.00',
      annualExpenseMessage: `Total de despesas para o ano de ${currentYear}`,
      annualBalance: '100.00',
      annualBalanceMessage: `Saldo total para o ano de ${currentYear}`,
      monthlyIncome: '100.00',
      monthlyIncomeMessage: `Total de receitas para o mês de ${currentMonthName}`,
      monthlyExpense: '0.00',
      monthlyExpenseMessage: `Total de despesas para o mês de ${currentMonthName}`,
      monthlyBalance: '100.00',
      monthlyBalanceMessage: `Saldo total para o mês de ${currentMonthName}`,
    })
  })

  it('should handle server error', async () => {
    ;(prisma.transacoes.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse)

    expect(mockStatus).toHaveBeenCalledWith(500)
    expect(mockJson).toHaveBeenCalledWith({ error: "Erro interno do servidor" })
  })
})
