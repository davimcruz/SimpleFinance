import { ThemeProvider } from "@/components/theme/theme-provider"
import { GetServerSidePropsContext } from "next"
import { parseCookies } from "nookies"
import jwt from "jsonwebtoken"
import "../../app/globals.css"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import CreateFlow from "@/components/setup/CreateFlow"
import Head from "next/head"

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
        destination: "/auth/signin",
        permanent: false,
      },
    }
  }

  return { props: {} }
}

export default function SetupPage() {
  const [budget, setBudget] = useState<string>("")


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
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <main className="flex flex-col items-center justify-center flex-1 gap-8 px-4 py-16 lg:px-0">
          <CreateFlow />
        </main>
      </div>
    </ThemeProvider>
  )
}
