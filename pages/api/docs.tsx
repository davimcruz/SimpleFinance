import { NextApiRequest, NextApiResponse } from "next"
import swaggerSpec from "../../swagger"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json")
  res.send(swaggerSpec)
}
