"use client"
import { Inter } from "next/font/google"
import { FormEvent, useState } from "react"
import { useRouter } from "next/router"
import "../../../app/globals.css"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

const inter = Inter({ subsets: ["latin"] })

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    console.log("Fazendo login com email:", email, "e senha:", password)
  }

  return (
    <div
      className={`${inter.className} flex items-center lg:justify-center lg:h-screen bg-slate-50`}
    >
      <Card className="w-[400px] h-[500px] flex-row">
        <CardTitle className="pt-10 text-center">SimpleFinance</CardTitle>
        <CardDescription className="pt-4 text-center">
          Faça seu login abaixo
        </CardDescription>
        <Separator className="mt-10"></Separator>
        <CardContent className="pt-10 pl-4">
          <form onSubmit={handleSubmit}>
            <div className="grid w-full max-w-sm items-center gap-5">
              <div>
                <Label htmlFor="email">Email:</Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="simplefinance@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Senha:</Label>
                <Input
                  type="password"
                  id="password"
                  placeholder="No mínimo 8 dígitos"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button className="mt-12 w-full" type="submit">
              Entrar
            </Button>
          </form>
        </CardContent>
        <div className="text-center justify-center">
          <a
            href="./signup"
            className="text-center text-sm hover:text-sky-400 text-slate-500"
          >
            Registrar uma conta
          </a>
        </div>
      </Card>
    </div>
  )
}
