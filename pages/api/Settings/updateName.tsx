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
  console.log("Requisição recebida:", req.method, req.body)

  if (req.method !== "POST") {
    console.log("Método não permitido:", req.method)
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { email, nome, sobrenome } = req.body
  const connection = mysql.createConnection(dbConfig)

  try {
    await new Promise<void>((resolve, reject) => {
      connection.connect((err: MysqlError | null) => {
        if (err) {
          console.error("Erro ao conectar ao banco de dados:", err)
          reject(err)
        } else {
          console.log("Conexão estabelecida com sucesso")
          resolve()
        }
      })
    })

    const updateQuery =
      "UPDATE usuarios SET nome = ?, sobrenome = ? WHERE email = ?"
    console.log("Query de atualização:", updateQuery)
    console.log("Valores:", [nome, sobrenome, email])
    await queryAsync(connection, updateQuery, [nome, sobrenome, email])

    console.log("Atualização bem-sucedida")
    return res
      .status(200)
      .json({ message: "Nome e sobrenome atualizados com sucesso" })
  } catch (error) {
    console.error("Erro:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  } finally {
    console.log("Finalizando conexão com o banco de dados")
    connection.end()
  }
}
