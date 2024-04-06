import { NextApiRequest, NextApiResponse } from "next"
import mysql, { Connection, MysqlError } from "mysql"

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

  const { email, imageUrl } = req.body
  console.log("Email:", email)
  console.log("ImageUrl:", imageUrl)

  const connection = mysql.createConnection(dbConfig)

  try {
    await new Promise<void>((resolve, reject) => {
      connection.connect((err: MysqlError | null) => {
        if (err) reject(err)
        else resolve()
      })
    })

    const updateQuery = "UPDATE usuarios SET image = ? WHERE email = ?"
    console.log("Update Query:", updateQuery)
    console.log("Values:", [imageUrl, email])

    await queryAsync(connection, updateQuery, [imageUrl, email])

    return res.status(200).json({ success: imageUrl })
  } catch (error) {
    console.error("Erro:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição" })
  } finally {
    connection.end()
  }
}
