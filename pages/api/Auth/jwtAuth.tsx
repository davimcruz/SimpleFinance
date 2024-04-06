import jwt from "jsonwebtoken"
import { GetServerSidePropsContext } from "next"
import { parseCookies } from "nookies"

export async function verifyToken(ctx: GetServerSidePropsContext) { 
  const { token } = parseCookies(ctx)
  if (!token) return false

  try {
    await jwt.verify(token, process.env.JWT_SECRET as string) 
    return true
  } catch (error) {
    return false
  }
}
