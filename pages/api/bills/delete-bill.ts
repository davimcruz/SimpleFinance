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
    await prisma.parcelas.deleteMany({
      where: { faturaId },
    })

    await prisma.faturas.delete({
      where: { faturaId },
    })

    res
      .status(200)
      .json({
        success: true,
        message: "Fatura e parcelas deletadas com sucesso",
      })
  } catch (error) {
    console.error("Erro ao deletar fatura e parcelas:", error)
    res.status(500).json({ error: "Erro ao deletar fatura e parcelas" })
  }
}
