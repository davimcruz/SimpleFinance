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

  const { nome, tipo, fonte, detalhesFonte, data, valor, transactionId } =
    req.body
  console.log("Transaction ID recebido:", transactionId)

  try {
    const extractedDate = data.substring(0, 10)
    const formattedDate = extractedDate.split("-").reverse().join("-")
    const formattedValue = valor.replace("R$", "").trim().replace(/\./g, "")

    await prisma.transacoes.update({
      where: { transactionId },
      data: {
        nome,
        tipo,
        fonte,
        detalhesFonte: detalhesFonte || null,
        data: formattedDate || null,
        valor: formattedValue || null,
      },
    })

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    res.status(500).json({ error: "Erro ao processar a requisição" })
  } finally {
    await prisma.$disconnect()
  }
}