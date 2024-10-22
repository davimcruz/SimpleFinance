import Head from "next/head"

import { GetServerSideProps } from "next"
import { Inter } from "next/font/google"
import "../../app/globals.css"

import { ThemeProvider } from "@/components/theme/theme-provider"
import { Skeleton } from "@/components/ui/skeleton"

import Summary from "@/components/dashboard/summary/Summary"
import TransactionsTable from "@/components/dashboard/table/TransactionsTable"
import FinancesGraph from "@/components/dashboard/graphs/FinancesGraph"
import Header from "@/components/header/HeaderComponent"

import { getServerSidePropsDashboard } from "@/utils/getServerSideProps"

const inter = Inter({ subsets: ["latin"] })

const DashboardPage = ({
  user,
}: {
  user?: { nome: string; sobrenome: string; image?: string }
}) => {
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
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </Head>
      <div className={`${inter.className} flex min-h-screen w-full flex-col`}>
        <Header userImage={user?.image} />
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
          <Summary initialData={null} />
          <div className="grid lg:max-h-96 gap-4 md:gap-8 xl:grid-cols-3">
            <TransactionsTable />
            <FinancesGraph />
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

export const getServerSideProps: GetServerSideProps =
  getServerSidePropsDashboard

export default DashboardPage
