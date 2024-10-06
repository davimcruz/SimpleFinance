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
