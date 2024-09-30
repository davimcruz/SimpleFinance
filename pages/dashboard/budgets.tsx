import { GetServerSideProps } from "next"
import { Inter } from "next/font/google"
import "../../app/globals.css"

import { ThemeProvider } from "@/components/theme/theme-provider"

import Header from "@/components/dashboard/header/HeaderComponent"


import { getServerSidePropsDashboard } from "@/utils/getServerSideProps"
import Head from "next/head"

const inter = Inter({ subsets: ["latin"] })

const Budgets = ({
  user,
}: {
  user?: { nome: string; sobrenome: string; image?: string }
}) => {
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
      </div>
    </ThemeProvider>
  )
}

export const getServerSideProps: GetServerSideProps =
  getServerSidePropsDashboard

export default Budgets
