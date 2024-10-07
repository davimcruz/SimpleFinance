import { NextApiRequest, NextApiResponse } from "next"
import { verifyToken } from "../auth/middleware-jwt-auth"
import prisma from "@/lib/prisma"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Recebendo requisição:", req.method, req.body)

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ error: "Não autorizado" })
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { faturaId } = req.query

  if (!faturaId || typeof faturaId !== "string") {
    return res.status(400).json({ error: "Fatura ID inválido" })
  }

  try {
    const parcelas = await prisma.parcelas.findMany({
      where: { faturaId },
      select: {
        parcelaId: true,
        valorParcela: true,
        mes: true,
        ano: true,
        transacao: {
          select: {
            nome: true,
            tipo: true,
            fonte: true,
          },
        },
      },
    })

    if (!parcelas.length) {
      return res.status(404).json({ error: "Nenhuma parcela encontrada" })
    }

    return res.status(200).json(parcelas)
  } catch (error) {
    console.error("Erro ao buscar parcelas:", error)
    return res.status(500).json({ error: "Erro ao buscar parcelas" })
  }
}
