// Em /pages/api/jwtAuth.js ou jwtAuth.ts
import jwt from "jsonwebtoken"
import { GetServerSidePropsContext } from "next"
import { parseCookies } from "nookies"

export async function verifyToken(ctx: GetServerSidePropsContext) {
  const { token } = parseCookies(ctx)
  if (!token) return false

  try {
    await jwt.verify(token, process.env.JWT_SECRET as string) // Supondo que isso seja assíncrono
    return true
  } catch (error) {
    return false
  }
}
