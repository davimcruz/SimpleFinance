import { useState, useEffect } from "react"

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

const DashboardPage = () => {
  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")

  useEffect(() => {
    const emailFromCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("email="))
      ?.split("=")[1]

    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `/api/Queries/query?email=${emailFromCookie}`
        )
        if (!response.ok) {
          throw new Error("Erro ao obter dados do usuário")
        }
        const userData = await response.json()
        setName(userData.nome)
        setLastName(userData.sobrenome)
      } catch (error) {
        console.error(error)
      }
    }

    fetchUserData()
  }, [])

  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <div className={`${inter.className} flex min-h-screen w-full flex-col`}>
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div>
            {!name || !lastName ? (
              <Skeleton className="h-8 w-[230px]" />
            ) : (
              <h1 className="ml-2 text-2xl font-bold py-2 lg:py-0">
                Olá, {name} {lastName}
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

  console.log("Token verificado com sucesso.")
  return { props: {} }
}

export default DashboardPage
