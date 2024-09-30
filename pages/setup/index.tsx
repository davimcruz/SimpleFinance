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
import CreateBudgetsComponent from "@/components/setup/createBudgetsComponent"

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
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <main className="flex flex-col items-center justify-center flex-1 gap-8 px-4 py-16 lg:px-0">
          <CreateBudgetsComponent/>
        </main>
      </div>
    </ThemeProvider>
  )
}
