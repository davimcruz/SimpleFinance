import { GetServerSideProps } from "next"
import { Inter } from "next/font/google"
import "../../app/globals.css"

import { ThemeProvider } from "@/components/theme/theme-provider"

import Header from "@/components/dashboard/header/HeaderComponent"

import TransactionsFull from "@/components/transactions/TransactionsFull"

import { getServerSidePropsDashboard } from "@/utils/getServerSideProps"

const inter = Inter({ subsets: ["latin"] })

const Transactions = ({
  user,
}: {
  user?: { nome: string; sobrenome: string; image?: string }
}) => {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <div className={`${inter.className} flex min-h-screen w-full flex-col`}>
        <Header userImage={user?.image} />
        <TransactionsFull />
      </div>
    </ThemeProvider>
  )
}

export const getServerSideProps: GetServerSideProps =
  getServerSidePropsDashboard

export default Transactions
