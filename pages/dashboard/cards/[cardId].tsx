import React from "react"
import { useRouter } from "next/router"
import { GetServerSideProps } from "next"
import { Inter } from "next/font/google"
import "../../../app/globals.css"

import { ThemeProvider } from "@/components/theme/theme-provider"
import Header from "@/components/header/HeaderComponent"
import { getServerSidePropsDashboard } from "@/utils/getServerSideProps"
import Head from "next/head"
import BillsTable from "@/components/cards/cardsTable.tsx/Bills/BillsTable"

const inter = Inter({ subsets: ["latin"] })

const CardDetailsPage = ({
  user,
}: {
  user?: { nome: string; sobrenome: string; image?: string }
}) => {
  const router = useRouter()
  const { cardId } = router.query 


  if (!cardId) {
    return <div>Carregando...</div>
  }

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
        <div className="p-6">
          <BillsTable cardId={cardId as string} />
        </div>
      </div>
    </ThemeProvider>
  )
}

export const getServerSideProps: GetServerSideProps =
  getServerSidePropsDashboard

export default CardDetailsPage
