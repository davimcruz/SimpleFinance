import mysql, { MysqlError } from "mysql"
import { dbConfig } from "@/config/dbConfig"
import { NextApiRequest, NextApiResponse } from "next"

const pool = mysql.createPool(dbConfig)

export default async function queryTransactions(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    let userId: number | undefined
    try {
      const cookies = req.headers.cookie
      if (!cookies) {
        throw new Error("Cookies não encontrados na requisição.")
      }
      const userIdCookie = cookies
        .split("; ")
        .find((row) => row.startsWith("userId="))
      if (!userIdCookie) {
        throw new Error("Cookie userId não encontrado na requisição.")
      }
      userId = parseInt(userIdCookie.split("=")[1])
      if (isNaN(userId)) {
        throw new Error("Valor do userId nos cookies não é um número.")
      }
    } catch (error) {
      console.error("Erro ao obter userId dos cookies:", error)
      return res.status(500).json({ error: "Erro ao obter userId dos cookies" })
    }

    pool.getConnection((err: MysqlError, connection) => {
      if (err) {
        console.error("Erro ao obter conexão do pool:", err)
        return res
          .status(500)
          .json({ error: "Erro ao conectar ao banco de dados" })
      }

      const query = "SELECT * FROM transacoes WHERE userId = ?"
      connection.query(query, [userId], (error, results) => {
        connection.release()

        if (error) {
          console.error("Erro na query:", error)
          return res.status(500).json({ error: "Erro ao executar consulta" })
        }
        resolve(results)
      })
    })
  })
}
