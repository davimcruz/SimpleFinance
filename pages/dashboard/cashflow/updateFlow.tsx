import { GetServerSideProps } from "next"
import { Inter } from "next/font/google"
import "../../../app/globals.css"

import { ThemeProvider } from "@/components/theme/theme-provider"

import Header from "@/components/header/HeaderComponent"

import { getServerSidePropsDashboard } from "@/utils/getServerSideProps"
import Head from "next/head"
import UpdateFlow from "@/components/cashflow/UpdateFlow"
const inter = Inter({ subsets: ["latin"] })

const CashFlow = ({
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
      </Head>
      <div className={`${inter.className} flex min-h-screen w-full flex-col`}>
        <Header userImage={user?.image} />
        <div className="flex min-h-[80vh] flex-col items-center justify-center p-6">
          <main className="flex flex-col items-center justify-center flex-1 gap-8 px-4 py-16 lg:px-0">
            <UpdateFlow />
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}

export const getServerSideProps: GetServerSideProps =
  getServerSidePropsDashboard

export default CashFlow
