import { NextApiRequest, NextApiResponse } from "next"
import mysql, { Connection, MysqlError } from "mysql"
import { v4 as uuidv4 } from "uuid"

interface Usuario {
  id: string
  email: string
  senha: string
  nome: string
  sobrenome: string
}

const dbConfig = {
  host: "mysql.freehostia.com",
  user: "davmac53_simplefinance",
  password: "admin123",
  database: "davmac53_simplefinance",
}

const queryAsync = (
  connection: Connection,
  query: string,
  values: any[]
): Promise<any> => {
  return new Promise((resolve, reject) => {
    connection.query(
      query,
      values,
      (err: MysqlError | null, results?: any[]) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      }
    )
  })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { email, password, nome, sobrenome } = req.body
  const id = uuidv4()
  const connection = mysql.createConnection(dbConfig)

  try {
    await new Promise<void>((resolve, reject) => {
      connection.connect((err: MysqlError | null) => {
        if (err) reject(err)
        else resolve()
      })
    })

    const checkQuery = "SELECT * FROM usuarios WHERE email = ?"
    const rows = await queryAsync(connection, checkQuery, [email])

    if (rows.length > 0) {
      return res.status(400).json({ error: "Email já registrado" })
    }

    const insertQuery =
      "INSERT INTO usuarios (id, email, senha, nome, sobrenome) VALUES (?, ?, ?, ?, ?)"
    await queryAsync(connection, insertQuery, [
      id,
      email,
      password,
      nome,
      sobrenome,
    ])
    console.log("Usuário registrado com sucesso")

    return res.status(201).json({ message: "Usuário registrado com sucesso" })
  } catch (error) {
    console.error("Erro:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  } finally {
    connection.end()
  }
}
