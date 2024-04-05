import jwt from "jsonwebtoken"
import { GetServerSidePropsContext } from "next"
import { parseCookies } from "nookies"

export async function verifyToken(ctx: GetServerSidePropsContext) { //Utilizar ServerSideProps do Next para verificação via serverside
  const { token } = parseCookies(ctx)
  if (!token) return false

  try {
    await jwt.verify(token, process.env.JWT_SECRET as string) //Verificação de token assíncrona
    return true
  } catch (error) {
    return false
  }
}
