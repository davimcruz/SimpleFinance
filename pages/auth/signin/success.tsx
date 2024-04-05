import { useEffect } from "react"
import Router from "next/router"
import Cookies from "js-cookie"
import jwt from "jsonwebtoken"
import { Inter } from "next/font/google"
import Image from "next/image"
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

const goDashboard = () => {
  Router.push("/dashboard")
}

const SuccessLogin = () => {
  useEffect(() => {
    const token = Cookies.get("token")
    if (!token) {
      console.log(token)
      return
    }

    try {
      jwt.verify(
        token,
        "xZrqJqLg2l1+2KoMcRlUHgVgPvP4XmUqxCm4UF8X9IAn1xH8xS7HcU5Y+bey7FZy4/+nNg02wOT0cGtLQ+ZzRg=="
      )
    } catch (error) {
      console.log("jwt invalido")
    }
  }, [])

  return (
    <div
      className={`${inter.className} flex items-center lg:justify-center lg:h-screen bg-slate-50`}
    >
      <Card className="w-[400px] flex-row transition-all duration-300 ">
        <CardTitle className="flex pt-10 items-center justify-center">
          <Image
            className="px-6"
            src="https://simplefinance-prod.vercel.app/logo.svg"
            width={400}
            height={100}
            alt="Simple Finance Logo"
          />
        </CardTitle>
        <CardDescription className="pt-4 text-center">
          Seu login foi realizado com sucesso
        </CardDescription>
        <Separator className="mt-10" />
        <CardContent className="flex justify-center items-center text-center">
          <Button
            onClick={goDashboard}
            className="mt-8 w-full transition duration-300 ease-in-out"
          >
            Ir para Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default SuccessLogin
