import Router from "next/router"
import { Inter } from "next/font/google"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { ModeToggle } from "@/components/theme/toggleTheme"
import { ThemeProvider } from "@/components/theme/theme-provider"

import "../../../app/globals.css"

const inter = Inter({ subsets: ["latin"] })

const goSignIn = () => {
  Router.push("/auth/signin")
}

export default function SuccessRegister() {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <div
        className={`${inter.className} flex items-center justify-center max-h-[90vh] min-h-[90vh]`}
      >
        <div className="fixed right-4 top-4 lg:block hidden">
          <ModeToggle />
        </div>
        <Card className="w-[90vw] lg:w-[400px] flex-row transition-all duration-300 ">
          <CardTitle className="flex text-4xl pt-10 items-center justify-center">
            SimpleFinance
          </CardTitle>
          <CardDescription className="pt-4 text-center">
            Seu cadastro foi realizado com sucesso
          </CardDescription>
          <Separator className="mt-10"></Separator>
          <CardContent className="flex justify-center items-center text-center">
            <Button
              onClick={goSignIn}
              className="mt-8 w-full transition duration-300 ease-in-out"
            >
              Ir para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  )
}
