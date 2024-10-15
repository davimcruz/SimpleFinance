import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/budget/update-flow';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/pages/api/middleware/jwt-auth';
import { realocarFluxo } from '@/utils/flowUtils';

jest.mock('@/lib/prisma', () => ({
  orcamento: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
}));

jest.mock('@/pages/api/middleware/jwt-auth', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('@/utils/flowUtils', () => ({
  realocarFluxo: jest.fn(),
}));

describe('/api/budget/update-flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('deve atualizar o fluxo de caixa com sucesso', async () => {
    const mockFlow = {
      10: { receitaOrcada: 5000, despesaOrcada: 4000 },
      11: { receitaOrcada: 5500, despesaOrcada: 4500 },
    };

    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        userId: 1,
        flow: mockFlow,
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(true);
    (prisma.orcamento.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);
    (realocarFluxo as jest.Mock).mockResolvedValue([
      { mes: 10, receita: 5000, despesa: 4000, saldo: 1000, status: 'excedente' },
      { mes: 11, receita: 5500, despesa: 4500, saldo: 2000, status: 'excedente' },
    ]);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: "Cash flow atualizado e realocado com sucesso",
      flowAtualizado: expect.any(Array),
    });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(realocarFluxo).toHaveBeenCalledWith(1);
  });

  it('deve retornar erro 404 quando não existe fluxo de caixa', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        userId: 1,
        flow: {},
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(true);
    (prisma.orcamento.findFirst as jest.Mock).mockResolvedValue(null);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      message: "Não existe um cash flow para este usuário neste ano",
    });
  });

  it('deve retornar erro 401 para token inválido', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        userId: 1,
        flow: {},
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(false);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Não autorizado',
    });
  });

  it('deve retornar erro 400 para dados inválidos', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        userId: 'invalid',
        flow: {
          13: { receitaOrcada: -100, despesaOrcada: 'invalid' },
        },
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(true);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData()).message).toBe("Erro de validação");
    expect(console.error).toHaveBeenCalledWith(
      "Erro ao atualizar e realocar cash flow:",
      expect.any(Error)
    );
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
      method: 'PUT',
      body: {
        userId: 1,
        flow: {
          10: { receitaOrcada: 5000, despesaOrcada: 4000 },
        },
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue(true);
    (prisma.orcamento.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Erro de banco de dados'));

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: "Erro ao atualizar e realocar cash flow",
      error: "Erro de banco de dados",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Erro ao atualizar e realocar cash flow:",
      expect.any(Error)
    );
  });
});
