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

const inter = Inter({ subsets: ["latin"] })

export default function AdminLogin() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/Auth/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        window.location.href = "/admin"
      } else {
        setError(data.error || "Credenciais inválidas.")
      }
    } catch (error) {
      console.error("Erro na requisição:", error)
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
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Usuário:</Label>
                <Input
                  type="text"
                  id="username"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Senha:</Label>
                <Input
                  type="password"
                  id="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
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
