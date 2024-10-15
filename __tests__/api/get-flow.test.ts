import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/budget/get-flow';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/pages/api/middleware/jwt-auth';
import { monthNames } from '@/utils/monthNames';

jest.mock('@/lib/prisma', () => ({
  orcamento: {
    findMany: jest.fn(),
  },
}));

jest.mock('@/pages/api/middleware/jwt-auth', () => ({
  verifyToken: jest.fn(),
}));

describe('/api/budget/get-flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('deve retornar o fluxo de caixa corretamente', async () => {
    const mockFlows = [
      { mes: 10, receita: 5000, despesa: 4000, saldo: 1000, status: 'excedente' },
      { mes: 11, receita: 5500, despesa: 5000, saldo: 1500, status: 'excedente' },
      { mes: 12, receita: 6000, despesa: 5500, saldo: 2000, status: 'excedente' },
    ];

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        userId: '1',
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(true);
    (prisma.orcamento.findMany as jest.Mock).mockResolvedValue(mockFlows);

    const mockDate = new Date(2023, 9, 1); 
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      message: "Fluxo de caixa obtido com sucesso",
      flows: mockFlows.map(flow => ({
        ...flow,
        nome: monthNames[flow.mes - 1],
      })),
    });

    expect(prisma.orcamento.findMany).toHaveBeenCalledWith({
      where: {
        userId: 1,
        ano: 2023,
        mes: {
          gte: 10
        }
      },
      orderBy: {
        mes: "asc",
      },
    });
  });

  it('deve retornar erro 401 para token inválido', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        userId: '1',
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(false);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Não autorizado',
    });
  });

  it('deve retornar erro 400 para userId inválido', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        userId: 'invalid',
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(true);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'UserId não fornecido ou inválido',
    });
  });

  it('deve retornar erro 405 para método não permitido', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Método não permitido',
    });
  });

  it('deve lidar com erro interno do servidor', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        userId: '1',
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(true);
    (prisma.orcamento.findMany as jest.Mock).mockRejectedValue(new Error('Erro de banco de dados'));

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Erro ao obter fluxo de caixa',
      error: 'Erro de banco de dados',
    });
    expect(console.error).toHaveBeenCalledWith(
      "Erro ao obter fluxo de caixa:",
      expect.any(Error)
    );
  });
});
