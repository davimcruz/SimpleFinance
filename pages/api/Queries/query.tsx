import { NextApiRequest, NextApiResponse } from "next"
import mysql, { Connection, MysqlError } from "mysql"
import { dbConfig } from "@/config/dbConfig"

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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { email } = req.query
  const connection = mysql.createConnection(dbConfig)

  try {
    await new Promise<void>((resolve, reject) => {
      connection.connect((err: MysqlError | null) => {
        if (err) reject(err)
        else resolve()
      })
    })

    const selectQuery =
      "SELECT id, nome, sobrenome, image FROM usuarios WHERE email = ?"
    const rows = await queryAsync(connection, selectQuery, [email])

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" })
    }

    const { id, nome, sobrenome, image } = rows[0]

    return res.status(200).json({ id, nome, sobrenome, image })
  } catch (error) {
    console.error("Erro:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  } finally {
    
    connection.end()
  }
}
