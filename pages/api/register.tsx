import { NextApiRequest, NextApiResponse } from "next"
import mysql from "mysql"
import { v4 as uuidv4 } from "uuid"

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
    const id = uuidv4()
    const connection = mysql.createConnection(dbConfig)

    connection.connect((err) => {
      if (err) {
        console.error("Erro ao conectar ao MySQL:", err)
        res.status(500).json({ error: "Erro ao conectar ao banco de dados" })
        return
      }

      const checkQuery = `SELECT * FROM usuarios WHERE email = ?`
      connection.query(checkQuery, [email], (err, rows) => {
        if (err) {
          console.error("Erro ao verificar email:", err)
          res.status(500).json({ error: "Erro ao verificar email" })
          connection.end() 
          return
        }

        if (rows.length > 0) {
          res.status(400).json({ error: "Email já registrado" })
          connection.end() 
          return
        }

        const insertQuery = `INSERT INTO usuarios (id, email, senha) VALUES (?, ?, ?)`
        connection.query(insertQuery, [id, email, password], (err, result) => {
          if (err) {
            console.error("Erro ao registrar usuário:", err)
            res.status(500).json({ error: "Erro ao registrar usuário" })
            connection.end()
            return
          }
          console.log("Usuário registrado com sucesso")
          res.status(201).json({ message: "Usuário registrado com sucesso" })
          connection.end()
        })
      })
    })
  } else {
    res.status(405).json({ error: "Método não permitido" })
  }
}
