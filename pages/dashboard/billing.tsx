import { GetServerSideProps } from "next"

import { Inter } from "next/font/google"

import "../../app/globals.css"

import { ThemeProvider } from "@/components/theme/theme-provider"
import { verifyToken } from "../api/Auth/jwtAuth"

import Header from "@/components/dashboard/header"

const inter = Inter({ subsets: ["latin"] })

const Billing = () => {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <div className={`${inter.className} flex min-h-screen w-full flex-col`}>
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8"></main>
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

export default Billing
