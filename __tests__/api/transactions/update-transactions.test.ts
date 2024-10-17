import { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/transactions/update-transactions'
import { verifyToken } from '@/pages/api/middleware/jwt-auth'
import prisma from '@/lib/prisma'

jest.mock('@/pages/api/middleware/jwt-auth')
jest.mock('@/lib/prisma', () => ({
  transacoes: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  parcelas: {
    updateMany: jest.fn(),
    aggregate: jest.fn(),
  },
  faturas: {
    update: jest.fn(),
  },
  cartoes: {
    findUnique: jest.fn(),
  },
}))

// Mock do Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    del: jest.fn(),
  }))
})

const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

describe('update-transactions API', () => {
  let mockReq: Partial<NextApiRequest>
  let mockRes: Partial<NextApiResponse>
  let mockJson: jest.Mock
  let mockStatus: jest.Mock

  beforeEach(() => {
    mockJson = jest.fn()
    mockStatus = jest.fn().mockReturnThis()
    mockRes = {
      json: mockJson,
      status: mockStatus,
    }
    mockReq = {
      method: 'POST',
      body: {
        transactionId: 'mock-transaction-id',
        valor: 1000,
      },
    }
    ;(verifyToken as jest.Mock).mockResolvedValue(true)
    jest.clearAllMocks()
  })

  it('should update a transaction successfully', async () => {
    const mockTransaction = {
      transactionId: 'mock-transaction-id',
      userId: 1,
      parcelas: [
        { faturaId: 'fatura-1' },
        { faturaId: 'fatura-2' },
      ],
    }
    ;(prisma.transacoes.findUnique as jest.Mock).mockResolvedValue(mockTransaction)
    ;(prisma.transacoes.update as jest.Mock).mockResolvedValue({ ...mockTransaction, valor: 1000 })
    ;(prisma.parcelas.updateMany as jest.Mock).mockResolvedValue({ count: 2 })
    ;(prisma.parcelas.aggregate as jest.Mock).mockResolvedValue({ _sum: { valorParcela: 500 } })
    ;(prisma.faturas.update as jest.Mock).mockResolvedValue({ valorTotal: 500 })

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse)

    expect(mockStatus).toHaveBeenCalledWith(200)
    expect(mockJson).toHaveBeenCalledWith({ success: true })
    expect(prisma.transacoes.update).toHaveBeenCalledWith({
      where: { transactionId: 'mock-transaction-id' },
      data: { valor: 1000 },
    })
    expect(prisma.parcelas.updateMany).toHaveBeenCalledWith({
      where: { transacaoId: 'mock-transaction-id' },
      data: { valorParcela: 500 },
    })
    expect(prisma.parcelas.aggregate).toHaveBeenCalled()
    expect(prisma.faturas.update).toHaveBeenCalledTimes(2)
  })

  it('should return 404 if transaction is not found', async () => {
    ;(prisma.transacoes.findUnique as jest.Mock).mockResolvedValue(null)

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse)

    expect(mockStatus).toHaveBeenCalledWith(404)
    expect(mockJson).toHaveBeenCalledWith({ error: "Transação não encontrada" })
  })

  it('should return 400 if transactionId is missing', async () => {
    mockReq.body = {}

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse)

    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockJson).toHaveBeenCalledWith({ error: "transactionId é obrigatório" })
  })

  it('should return 401 if token is invalid', async () => {
    ;(verifyToken as jest.Mock).mockResolvedValue(false)

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse)

    expect(mockStatus).toHaveBeenCalledWith(401)
    expect(mockJson).toHaveBeenCalledWith({ error: "Não autorizado" })
  })

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Database error')
    ;(prisma.transacoes.findUnique as jest.Mock).mockRejectedValue(mockError)

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse)

    expect(mockStatus).toHaveBeenCalledWith(500)
    expect(mockJson).toHaveBeenCalledWith({ error: "Erro ao processar a requisição" })
    expect(mockConsoleError).toHaveBeenCalledWith("Erro ao processar a requisição:", mockError)
  })

  afterEach(() => {
    mockConsoleError.mockClear()
  })
})
