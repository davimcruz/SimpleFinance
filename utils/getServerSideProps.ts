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

  const emailCookie = ctx.req.cookies.email

  if (!emailCookie) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    }
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/Queries/query?email=${emailCookie}`
    )
    const userData = await response.json()

    return {
      props: {
        user: userData || null, // Passa userData com a imagem
      },
    }
  } catch (error) {
    console.error("Erro ao buscar os dados do usuário:", error)
    return {
      props: {
        user: null, // Em caso de erro, passamos null para evitar crash no render
      },
    }
  }
}
