import { Inter } from "next/font/google"
import { useState } from "react"
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

import { ModeToggle } from "@/components/theme/toggleTheme"
import { ThemeProvider } from "@/components/theme/theme-provider"

import "../../../app/globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/Auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      router.push("/auth/signin/success")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <div
        className={`${inter.className} flex items-center justify-center h-screen`}
      >
        <div className="fixed right-4 top-4 lg:block hidden">
          <ModeToggle />
        </div>
        <Card className="w-[400px] flex-row">
          <CardTitle className="flex text-4xl pt-10 items-center justify-center">
            SimpleFinance
          </CardTitle>
          <CardDescription className="pt-4 text-center">
            Faça login com sua conta
          </CardDescription>
          <Separator className="mt-10" />
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
                disabled={loading}
              >
                {loading ? "Logando..." : "Logar"}
              </Button>
              {error && (
                <p className="mt-4 text-center transition text-sm">{error}</p>
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
    </ThemeProvider>
  )
}
