import { NextApiRequest, NextApiResponse } from "next"
import mysql, { MysqlError } from "mysql"
import jwt, { Secret } from "jsonwebtoken"
import { serialize } from "cookie"
import { dbConfig } from "@/config/dbConfig"

const pool = mysql.createPool(dbConfig)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  const { email, password } = req.body

  try {
    pool.getConnection((err: MysqlError, connection) => {
      if (err) {
        console.error("Erro ao conectar ao banco de dados:", err)
        return res
          .status(500)
          .json({ error: "Erro ao processar a requisição." })
      }

      const query = "SELECT id, email, senha FROM usuarios WHERE email = ?"
      connection.query(query, [email], (error, results) => {
        connection.release()

        if (error) {
          console.error("Erro ao executar consulta:", error)
          return res
            .status(500)
            .json({ error: "Erro ao processar a requisição." })
        }

        if (results.length === 0) {
          return res.status(401).json({ error: "Email não registrado." })
        }

        const user = results[0]
        if (user.senha !== password) {
          return res.status(401).json({ error: "Senha incorreta." })
        }

        const token = jwt.sign(
          { email: user.email },
          "xZrqJqLg2l1+2KoMcRlUHgVgPvP4XmUqxCm4UF8X9IAn1xH8xS7HcU5Y+bey7FZy4/+nNg02wOT0cGtLQ+ZzRg==" as Secret,
          {
            expiresIn: "24h",
          }
        )

        const cookieToken = serialize("token", token, {
          httpOnly: true,
          sameSite: "strict",
          maxAge: 86400,
          path: "/",
        })

        const cookieEmail = serialize("email", user.email, {
          httpOnly: false,
          sameSite: "strict",
          maxAge: 86400,
          path: "/",
        })

        const cookieUserId = serialize("userId", user.id, {
          httpOnly: false,
          sameSite: "strict",
          maxAge: 86400,
          path: "/",
        })

        res.setHeader("Set-Cookie", [cookieToken, cookieEmail, cookieUserId])

        return res.status(200).json({ message: "Login bem-sucedido." })
      })
    })
  } catch (error) {
    console.error("Erro:", error)
    return res.status(500).json({ error: "Erro ao processar a requisição." })
  }
}
