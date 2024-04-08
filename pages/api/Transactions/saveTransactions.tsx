import { NextApiRequest, NextApiResponse } from "next"
import mysql from "mysql"

// Configuração do banco de dados
const dbConfig = {
  host: "mysql.freehostia.com",
  user: "davmac53_simplefinance",
  password: "admin123",
  database: "davmac53_simplefinance",
}

const queryAsync = (query: string, values: any[] = []): Promise<any> => {
  console.log("Conectando ao banco de dados...")
  const connection = mysql.createConnection(dbConfig)
  return new Promise((resolve, reject) => {
    console.log("Executando query:", query, values)
    connection.query(query, values, (err, results) => {
      console.log("Query executada.")
      connection.end() // Encerra a conexão após a execução da query
      if (err) {
        console.log("Erro na query:", err)
        reject(err)
      } else {
        console.log("Resultados da query:", results)
        resolve(results)
      }
    })
  })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Recebendo requisição:", req.method, req.body)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const email = req.body.email
  console.log("Email recebido:", email)

  try {
    console.log("Buscando ID do usuário no banco...")
    const userResults = await queryAsync(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    )
    if (userResults.length === 0) {
      console.log("Usuário não encontrado")
      throw new Error("Usuário não encontrado")
    }

    const userId = userResults[0].id
    console.log("ID do usuário encontrado:", userId)

    // Aqui você pode prosseguir com a lógica para inserir a transação usando o ID obtido

    res.status(200).json({ userId })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
