import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Recebendo requisição:", req.method, req.body)

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { transactionId } = req.body
  console.log("Transaction ID recebido:", transactionId)

  try {
    await prisma.transacoes.delete({
      where: { transactionId },
    })

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    res.status(500).json({ error: "Erro ao processar a requisição" })
  } finally {
    console.log("Finalizando conexão com o banco de dados")
  }
}
