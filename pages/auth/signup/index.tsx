import { Inter } from "next/font/google"
import { FormEvent, useState } from "react"
import { useRouter } from "next/router"
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

export default function Register() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | undefined>(undefined)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    try {
      const response = await fetch("/api/auth", {
        // Alterado o caminho para a rota de registro no back-end
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error("Erro ao registrar usuário")
      }

      router.push("/auth/signin")
    } catch (error: any) {
      // Adicionando uma verificação de tipo explícita para a variável error
      setError(error.message)
    }
  }

  return (
    <div
      className={`${inter.className} flex items-center lg:justify-center lg:h-screen bg-slate-50`}
    >
      <Card className="w-[400px] h-[500px] flex-row">
        <CardTitle className="pt-10 text-center">SimpleFinance</CardTitle>
        <CardDescription className="pt-4 text-center">
          Faça seu registro abaixo
        </CardDescription>
        <Separator className="mt-10"></Separator>
        <CardContent className="pt-10 pl-4">
          <form onSubmit={handleSubmit}>
            {/* Adicionado o evento onSubmit ao formulário */}
            <div className="grid w-full max-w-sm items-center gap-5">
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
                  placeholder="No mínimo 8 dígitos"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button className="mt-12 w-full" type="submit">
              Registrar
            </Button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </form>
        </CardContent>
        <div className="text-center justify-center">
          <a
            href="./signin"
            className="text-center text-sm hover:text-sky-400 text-slate-500"
          >
            Já possuo conta
          </a>
        </div>
      </Card>
    </div>
  )
}
