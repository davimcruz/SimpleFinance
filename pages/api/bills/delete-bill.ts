import { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Metodo nao permitido" })
  }

  const { faturaId } = req.query

  if (!faturaId || typeof faturaId !== "string") {
    return res.status(400).json({ error: "faturaId invalido ou nao fornecido" })
  }

  try {
    const parcelas = await prisma.parcelas.findMany({
      where: { faturaId },
      select: { transacaoId: true }
    })

    const transacaoIds = parcelas.map(parcela => parcela.transacaoId)

    await prisma.transacoes.deleteMany({
      where: { transactionId: { in: transacaoIds } }
    })

    await prisma.parcelas.deleteMany({
      where: { faturaId }
    })

    await prisma.faturas.delete({
      where: { faturaId }
    })

    res.status(200).json({
      success: true,
      message: "Fatura, parcelas e transações associadas deletadas com sucesso"
    })
  } catch (error) {
    console.error("Erro ao deletar fatura, parcelas e transações:", error)
    res.status(500).json({ error: "Erro ao deletar fatura, parcelas e transações" })
  }
}
