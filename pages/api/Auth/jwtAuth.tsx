import jwt from "jsonwebtoken"
import { GetServerSidePropsContext } from "next"
import { parseCookies } from "nookies"

export async function verifyToken(ctx: GetServerSidePropsContext) { 
  const { token } = parseCookies(ctx)
  if (!token) return false

  try {
    await jwt.verify(
      token,
      "xZrqJqLg2l1+2KoMcRlUHgVgPvP4XmUqxCm4UF8X9IAn1xH8xS7HcU5Y+bey7FZy4/+nNg02wOT0cGtLQ+ZzRg==" as string
    ) 
    return true
  } catch (error) {
    return false
  }
}
