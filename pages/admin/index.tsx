import ManageUsersComponent from "@/components/admin/manageUsersComponent"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { GetServerSidePropsContext } from "next"
import { parseCookies } from "nookies"
import jwt from "jsonwebtoken"
import "../../app/globals.css"
import Head from "next/head"
import CreateTransactions from "@/components/dashboard/create-transactions/CreateTransactions"


async function verifyToken(ctx: GetServerSidePropsContext) {
  const { token } = parseCookies(ctx)
  if (!token) return false

  try {
    await jwt.verify(token, process.env.JWT_SECRET as string)
    return true
  } catch (error) {
    return false
  }
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const isVerified = await verifyToken(ctx)

  if (!isVerified) {
    return {
      redirect: {
        destination: "/admin/signin",
        permanent: false,
      },
    }
  }

  return { props: {} }
}

export default function AdminPage() {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <Head>
        <title>Simple Finance</title>
        <meta
          name="description"
          content="Descubra o Simple Finance, o principal software de finanças pessoais projetado para ajudá-lo a gerenciar orçamentos, despesas e cartões em um só lugar."
        />
        <meta
          property="og:title"
          content="Simple Finance - Seu Gerente de Finanças Pessoais"
        />
        <meta
          property="og:description"
          content="Simplifique seu gerenciamento financeiro com o Simple Finance. Acompanhe despesas, gerencie orçamentos e supervisione seus cartões com facilidade."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-between p-24">
        <main className="flex flex-col items-center justify-center flex-1 gap-8 px-4 py-16 lg:px-0">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <div className="flex flex-col lg:flex-row gap-8">
            <ManageUsersComponent />
            <CreateTransactions />
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}
