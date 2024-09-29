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

  const { nome, tipo, fonte, detalhesFonte, data, valor, transactionId } =
    req.body

  if (!transactionId || !nome || !tipo || !fonte || !data || !valor) {
    return res.status(400).json({ error: "Dados obrigatórios estão faltando" })
  }

  console.log("Transaction ID recebido:", transactionId)

  try {
    const cleanedValue = valor.replace("R$", "").trim()

    const extractedDate = data.split("T")[0]

    const formattedDate = extractedDate.split("-").reverse().join("-")

    await prisma.transacoes.update({
      where: { transactionId },
      data: {
        nome,
        tipo,
        fonte,
        detalhesFonte: detalhesFonte || null,
        data: formattedDate || null, 
        valor: cleanedValue || null, 
      },
    })

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
