import { NextApiRequest, NextApiResponse } from "next"
import mysql from "mysql"
import { dbConfig } from "@/config/dbConfig"

const pool = mysql.createPool(dbConfig)

const queryAsync = (query: string, values: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Erro ao obter conexão do pool:", err)
        return reject(err)
      }

      connection.query(query, values, (err, results) => {
        connection.release()

        if (err) {
          console.error("Erro na query:", err)
          return reject(err)
        }

        console.log("Resultados da query:", results)
        resolve(results)
      })
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

  const { nome, tipo, fonte, detalhesFonte, data, valor, transactionId } =
    req.body
  console.log("Transaction ID recebido:", transactionId)

  try {
    const extractedDate = data.substring(0, 10)
    const formattedDate = extractedDate.split("-").reverse().join("-")
    const formattedValue = valor.replace("R$", "").trim().replace(/\./g, "")

    await queryAsync(
      "UPDATE transacoes SET nome = ?, tipo = ?, fonte = ?, detalhesFonte = ?, data = ?, valor = ? WHERE transactionId = ?",
      [
        nome,
        tipo,
        fonte,
        detalhesFonte,
        formattedDate,
        formattedValue,
        transactionId,
      ]
    )

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    res.status(500).json({ error: "Erro ao processar a requisição" })
  }
}
