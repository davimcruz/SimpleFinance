import { GetServerSidePropsContext } from "next"
import { verifyToken } from "@/pages/api/Auth/jwtAuth"

export const getServerSidePropsDashboard = async (
  ctx: GetServerSidePropsContext
) => {
  const isVerified = await verifyToken(ctx)

  if (!isVerified) {
    console.log("Falha na verificação do token.")
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    }
  }

  const userIdCookie = ctx.req.cookies.userId

  if (!userIdCookie) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    }
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/Queries/query?userId=${userIdCookie}`
    )
    const userData = await response.json()

    return {
      props: {
        user: userData || null, 
      },
    }
  } catch (error) {
    console.error("Erro ao buscar os dados do usuário:", error)
    return {
      props: {
        user: null, 
      },
    }
  }
}
