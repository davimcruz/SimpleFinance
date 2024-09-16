import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Recebendo requisição:", req.method, req.body)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { email, nome, tipo, fonte, detalhesFonte, data, valor } = req.body
  console.log("Email recebido:", email)

  try {
    console.log("Buscando ID do usuário no banco...")
    const user = await prisma.usuarios.findUnique({
      where: { email },
    })

    if (!user) {
      console.log("Usuário não encontrado")
      throw new Error("Usuário não encontrado")
    }

    const userId = user.id
    console.log("ID do usuário encontrado:", userId)

    const transactionId = uuidv4()

    const extractedDate = data.substring(0, 10)
    const formattedDate = extractedDate.split("-").reverse().join("-")
    const formattedValue = valor.replace("R$", "").trim().replace(/\./g, "")

    console.log("Salvando transação no banco de dados...")
    await prisma.transacoes.create({
      data: {
        transactionId,
        userId,
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
