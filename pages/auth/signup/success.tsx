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

import "../../../app/globals.css"

const inter = Inter({ subsets: ["latin"] })

const goSignIn = () => {
  Router.push("/auth/signin")
}

export default function SuccessLogin() {
  return (
    <div
      className={`${inter.className} flex items-center lg:justify-center lg:h-screen bg-slate-50`}
    >
      <Card className="w-[400px] flex-row transition-all duration-300 ">
        <CardTitle className="pt-10 text-center">Sucesso!</CardTitle>
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
  )
}
