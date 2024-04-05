import { NextApiRequest, NextApiResponse } from "next"
import mysql, { Connection, MysqlError } from "mysql"
import jwt from "jsonwebtoken"
import { serialize } from "cookie"

interface Usuario {
  email: string
  senha: string
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

  const { email, password } = req.body

  const connection = mysql.createConnection(dbConfig)

  try {
    await new Promise<void>((resolve, reject) => {
      connection.connect((err: MysqlError | null) => {
        if (err) reject(err)
        else resolve()
      })
    })

    const query = "SELECT email, senha FROM usuarios WHERE email = ?"
    const results = await queryAsync(connection, query, [email])

    if (results.length === 0) {
      return res.status(401).json({ error: "Email não registrado." })
    }

    const user: Usuario = results[0]
    if (user.senha !== password) {
      return res.status(401).json({ error: "Senha incorreta." })
    }

    const token = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "24h",
      }
    )

    const cookie = serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: 86400, 
      path: "/",
    })

    res.setHeader("Set-Cookie", cookie)

    return res.status(200).json({ message: "Login bem-sucedido." })
  } catch (error) {
    console.error("Erro:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição." })
  } finally {
    connection.end()
  }
}