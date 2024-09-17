import { GetServerSideProps } from "next"
import { Inter } from "next/font/google"
import "../../app/globals.css"

import { ThemeProvider } from "@/components/theme/theme-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { verifyToken } from "../api/Auth/jwtAuth"

import Header from "@/components/dashboard/header/header"
import Summary from "@/components/dashboard/finances-summary"
import TransactionsTable from "@/components/dashboard/table/transactions-table"
import FinancesGraph from "@/components/dashboard/finances-graph"

const inter = Inter({ subsets: ["latin"] })

const DashboardPage = ({
  user,
}: {
  user?: { nome: string; sobrenome: string }
}) => {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <div className={`${inter.className} flex min-h-screen w-full flex-col`}>
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div>
            {!user || !user.nome || !user.sobrenome ? (
              <Skeleton className="h-8 w-[230px]" />
            ) : (
              <h1 className="ml-2 text-2xl font-bold py-2 lg:py-0">
                Olá, {user.nome} {user.sobrenome}
              </h1>
            )}
          </div>
          <Summary />
          <div className="grid lg:max-h-96 gap-4 md:gap-8 xl:grid-cols-3">
            <TransactionsTable />
            <FinancesGraph />
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
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
        user: userData || null, // (Obs: Dá para fazer com coalescência nula, acredito eu)
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

export default DashboardPage
