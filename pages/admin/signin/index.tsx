import { Inter } from "next/font/google"
import { useState } from "react"
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
import { ThemeProvider } from "@/components/theme/theme-provider"
import "../../../app/globals.css"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, LoginInput } from "@/lib/validation"

const inter = Inter({ subsets: ["latin"] })

export default function AdminLogin() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        window.location.href = "/admin"
      } else {
        setError(result.error || "Credenciais inválidas.")
      }
    } catch (err) {
      console.error("Erro na requisição:", err)
      setError("Erro ao tentar fazer login.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <div
        className={`${inter.className} flex items-center justify-center h-screen`}
      >
        <Card className="w-[90vw] max-w-[400px]">
          <CardTitle className="text-4xl text-center pt-10">
            Login Admin
          </CardTitle>
          <CardDescription className="text-center pt-4">
            Faça login para acessar o painel de administração
          </CardDescription>
          <Separator className="mt-10" />
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email:</Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="Digite seu email"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-red-600 text-center">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Senha:</Label>
                <Input
                  type="password"
                  id="password"
                  placeholder="Digite sua senha"
                  {...register("password")}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-red-600 text-center">
                    {errors.password.message}
                  </p>
                )}
              </div>
              {error && <p className="text-red-600 text-center">{error}</p>}
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  )
}
