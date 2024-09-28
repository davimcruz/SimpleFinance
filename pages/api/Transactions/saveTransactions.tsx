import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"
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

  const { email, nome, tipo, fonte, detalhesFonte, data, valor } = req.body

  if (!email || !nome || !tipo || !fonte || !data || !valor) {
    return res.status(400).json({ error: "Dados obrigatórios estão faltando" })
  }

  console.log("Email recebido:", email)

  try {
    console.log("Buscando ID do usuário no banco...")
    const user = await prisma.usuarios.findUnique({
      where: { email },
    })

    if (!user) {
      console.log("Usuário não encontrado")
      return res.status(404).json({ error: "Usuário não encontrado" })
    }

    const userId = user.id
    console.log("ID do usuário encontrado:", userId)

    const transactionId = uuidv4()

    const extractedDate = data.split("T")[0]
    const formattedDate = extractedDate.split("-").reverse().join("-") 

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
        valor: valor.replace("R$", "").trim() || null, 
      },
    })

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
