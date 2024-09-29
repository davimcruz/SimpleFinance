import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "../Auth/jwtAuth" 

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Recebendo requisição:", req.method, req.body)

  const tokenValid = await verifyToken({ req } as any)
  if (!tokenValid) {
    return res.status(401).json({ error: "Não autorizado" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { transactionId } = req.body

  if (!transactionId || typeof transactionId !== "string") {
    return res.status(400).json({ error: "Transaction ID inválido" })
  }

  console.log("Transaction ID recebido:", transactionId)

  try {
    await prisma.transacoes.delete({
      where: { transactionId },
    })

    console.log("Transação deletada com sucesso:", transactionId)
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar a transação:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
