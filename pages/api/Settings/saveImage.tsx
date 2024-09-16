import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { email, imageUrl } = req.body
  console.log("Email:", email)
  console.log("ImageUrl:", imageUrl)

  try {
    const updatedUser = await prisma.usuarios.update({
      where: { email },
      data: { image: imageUrl },
    })

    console.log("Updated User:", updatedUser)

    return res.status(200).json({ success: imageUrl })
  } catch (error) {
    console.error("Erro:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  } finally {
  }
}
