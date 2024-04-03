import { Inter } from "next/font/google"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import "../../../app/globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function SuccessLogin() {
  return (
    <div
      className={`${inter.className} flex items-center lg:justify-center lg:h-screen bg-slate-50`}
    >
      <Card className="w-[400px] flex-row transition-all duration-300 ">
        <CardTitle className="pt-10 text-center">SimpleFinance</CardTitle>
        <CardDescription className="pt-4 text-center">
          Seu login foi realizado com sucesso
        </CardDescription>
        <Separator className="mt-10"></Separator>
        <CardContent className="pt-10 pl-4 pb-3">
          <Button className="mt-8 w-full transition duration-300 ease-in-out">
            Ir para Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
