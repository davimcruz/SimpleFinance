import { Inter } from "next/font/google"
import { FormEvent, useState } from "react"
import { useRouter } from "next/router"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import "../../../app/globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function Register() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | undefined>(undefined)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error("Erro ao registrar novo usuário")
      }

      router.push("/auth/signin")
    } catch (error: any) {
      setError((error.message = "Este e-mail já foi cadastrado"))
    }
  }

  return (
    <div
      className={`${inter.className} flex items-center lg:justify-center lg:h-screen bg-slate-50`}
    >
      <Card className="w-[400px] flex-row transition-all duration-300 ">
        <CardTitle className="pt-10 text-center">SimpleFinance</CardTitle>
        <CardDescription className="pt-4 text-center">
          Faça login com sua conta
        </CardDescription>
        <Separator className="mt-10"></Separator>
        <CardContent className="pt-10 pl-4 pb-3">
          <form onSubmit={handleSubmit}>
            <div className="grid max-w-sm gap-5 mx-auto">
              <div>
                <Label htmlFor="email">Email:</Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="simplefinance@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Senha:</Label>
                <Input
                  type="password"
                  id="password"
                  placeholder="Sua senha"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="mt-8 w-full transition duration-300 ease-in-out"
              type="submit"
            >
              Registrar
            </Button>
            {error && (
              <p className="text-red-500 mt-4 text-center transition duration-300 ease-in-out">
                {error}
              </p>
            )}
          </form>
        </CardContent>
        <CardFooter className="text-center justify-center mt-auto py-4">
          <div className="text-center justify-center mt-auto">
            <a
              href="./signup"
              className="text-center text-sm mb-2 hover:text-sky-400 text-slate-500 transition duration-300"
            >
              Registar uma conta
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
