import { NextApiRequest, NextApiResponse } from "next"
import mysql from "mysql"

const dbConfig = {
  host: "mysql.freehostia.com",
  user: "davmac53_simplefinance",
  password: "admin123",
  database: "davmac53_simplefinance",
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { email, password } = req.body
    const connection = mysql.createConnection(dbConfig)

    console.log("Conectando ao MySQL...")

    connection.connect((err) => {
      if (err) {
        console.error("Erro ao conectar ao MySQL:", err)
        res.status(500).json({ error: "Erro ao conectar ao banco de dados" })
        return
      }

      const query = `SELECT * FROM usuarios WHERE email = ?`
      console.log("Executando query:", query)

      connection.query(query, [email], (err, rows) => {
        if (err) {
          console.error("Erro ao verificar email:", err)
          res.status(500).json({
            error: "Erro ao verificar email no banco de dados",
          })
          connection.end()
          return
        }

        console.log("Resultado da query:", rows)

        if (rows.length === 0) {
          console.log("Email não registrado")
          res.status(401).json({ error: "Email não registrado" })
          connection.end()
          return
        }

        const user = rows[0]
        if (user.senha !== password) {
          console.log("Senha incorreta")
          res.status(401).json({ error: "Senha incorreta" })
          connection.end()
          return
        }

        console.log("Login bem-sucedido")
        res.status(200).json({ message: "Login bem-sucedido" })
        connection.end()
      })
    })
  } else {
    res.status(405).json({ error: "Método não permitido" })
  }
}
