import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/budget/create-flow';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/pages/api/middleware/jwt-auth';
import { realocarFluxo } from '@/utils/flowUtils';

jest.mock('@/lib/prisma', () => ({
  orcamento: {
    findFirst: jest.fn(),
    createMany: jest.fn(),
  },
}));

jest.mock('@/pages/api/middleware/jwt-auth', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('@/utils/flowUtils', () => ({
  realocarFluxo: jest.fn(),
}));

describe('/api/budget/create-flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('deve criar um novo cash flow e realocar com sucesso (cenário positivo)', async () => {
    const flowData = {
      '10': { receitaOrcada: 10000.50, despesaOrcada: 8000.75 },
      '11': { receitaOrcada: 12000.25, despesaOrcada: 9000.50 },
      '12': { receitaOrcada: 15000.75, despesaOrcada: 10000.25 },
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 1,
        flow: flowData,
      },
    });

    const expectedFlowRealocado = [
      { userId: 1, mes: 10, ano: 2024, receita: 10000.50, despesa: 8000.75, saldo: 1999.75, status: 'excedente' },
      { userId: 1, mes: 11, ano: 2024, receita: 12000.25, despesa: 9000.50, saldo: 4999.50, status: 'excedente' },
      { userId: 1, mes: 12, ano: 2024, receita: 15000.75, despesa: 10000.25, saldo: 10000.00, status: 'excedente' },
    ];

    (verifyToken as jest.Mock).mockResolvedValue(true);
    (prisma.orcamento.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.orcamento.createMany as jest.Mock).mockResolvedValue({ count: 3 });
    (realocarFluxo as jest.Mock).mockResolvedValue(expectedFlowRealocado);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      message: 'Cash flow criado e realocado com sucesso',
      flowPlanejado: expectedFlowRealocado,
    });

    expect(prisma.orcamento.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 1,
        ano: 2024,
      },
    });
    expect(prisma.orcamento.createMany).toHaveBeenCalledTimes(1);
    expect(realocarFluxo).toHaveBeenCalledWith(1);
  });

  it('deve rejeitar a criação se já existe um cash flow para o usuário no ano atual', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 1,
        flow: {
          '10': { receitaOrcada: 1000, despesaOrcada: 800 },
        },
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(true);
    (prisma.orcamento.findFirst as jest.Mock).mockResolvedValue({ id: 1 });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Já existe um cash flow para este usuário neste ano',
    });
  });

  it('deve rejeitar a criação se não houver meses válidos', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 1,
        flow: {
          '1': { receitaOrcada: 1000, despesaOrcada: 800 },
          '2': { receitaOrcada: 1000, despesaOrcada: 800 },
        },
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(true);
    (prisma.orcamento.findFirst as jest.Mock).mockResolvedValue(null);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Erro de validação',
      error: expect.stringContaining('Apenas meses do mês atual até dezembro são permitidos'),
    });
    expect(console.error).toHaveBeenCalledWith(
      "Erro ao criar e realocar cash flow:",
      expect.any(Error)
    );
  });

  it('deve rejeitar fluxo com meses inválidos', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 1,
        flow: {
          '13': { receitaOrcada: 1000, despesaOrcada: 800 },
        },
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(true);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: 'Erro de validação',
      })
    );
    expect(console.error).toHaveBeenCalledWith(
      "Erro ao criar e realocar cash flow:",
      expect.any(Error)
    );
  });

  it('deve rejeitar valores negativos', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 1,
        flow: {
          '10': { receitaOrcada: -1000, despesaOrcada: 800 },
        },
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(true);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: 'Erro de validação',
      })
    );
    expect(console.error).toHaveBeenCalledWith(
      "Erro ao criar e realocar cash flow:",
      expect.any(Error)
    );
  });

  it('deve retornar erro 405 para métodos não permitidos', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Método não permitido',
    });
  });

  it('deve retornar erro 401 para token inválido', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 1,
        flow: {
          '10': { receitaOrcada: 1000, despesaOrcada: 800 },
        },
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(false);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Não autorizado',
    });
  });

  it('deve lidar com erro na criação do fluxo', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 1,
        flow: {
          '10': { receitaOrcada: 1000, despesaOrcada: 800 },
        },
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(true);
    (prisma.orcamento.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.orcamento.createMany as jest.Mock).mockRejectedValue(new Error('Erro ao criar fluxo'));

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: 'Erro ao criar e realocar cash flow',
      })
    );
    expect(console.error).toHaveBeenCalledWith(
      "Erro ao criar e realocar cash flow:",
      expect.any(Error)
    );
  });
});
