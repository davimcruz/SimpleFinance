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
import { ModeToggle } from "@/components/theme/toggleTheme"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { GetServerSidePropsContext } from "next"
import { parseCookies } from "nookies"
import jwt from "jsonwebtoken"
import "../../app/globals.css"

const inter = Inter({ subsets: ["latin"] })

async function verifyToken(ctx: GetServerSidePropsContext) {
  const { token } = parseCookies(ctx)
  if (!token) return false

  try {
    await jwt.verify(token, process.env.JWT_SECRET as string)
    return true
  } catch (error) {
    return false
  }
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const isVerified = await verifyToken(ctx)

  if (!isVerified) {
    return {
      redirect: {
        destination: "/admin/signin",
        permanent: false,
      },
    }
  }

  return { props: {} }
}

export default function AdminPage() {
  const [ids, setIds] = useState("")
  const [userNames, setUserNames] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleFetchUsers = async () => {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    const formattedIds = ids
      .split(/[,;.]+/)
      .map((id) => id.trim())
      .filter((id) => id)

    if (formattedIds.length === 0) {
      setError("Por favor, insira IDs válidos.")
      setLoading(false)
      return
    }

    try {
      const users = []

      for (const id of formattedIds) {
        const response = await fetch(`/api/Queries/queryId?id=${id}`)

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao buscar usuários.")
        }

        const data = await response.json()
        users.push(`${data.id}: ${data.nome} ${data.sobrenome}`)
      }

      setUserNames(users)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUsers = async () => {
    setDeleting(true)
    setError(null)
    setSuccessMessage(null)

    const formattedIds = ids
      .split(/[,;.]+/)
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id))

    if (formattedIds.length === 0) {
      setError("Por favor, insira IDs válidos.")
      setDeleting(false)
      return
    }

    try {
      const response = await fetch("/api/Users/deleteUsers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: formattedIds }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao excluir usuários.")
      }

      setUserNames([])
      setIds("")
      setSuccessMessage("Usuários e transações excluídos com sucesso!")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <div
        className={`${inter.className} flex items-center justify-center max-h-[90vh] min-h-[90vh]`}
      >
        <div className="fixed right-4 top-4 lg:block hidden">
          <ModeToggle />
        </div>
        <Card className="w-[90vw] lg:w-[400px] flex-row">
          <CardTitle className="flex text-2xl pt-10 items-center justify-center">
            Admin - Excluir Usuários
          </CardTitle>
          <CardDescription className="pt-4 text-center">
            Insira os IDs dos usuários que deseja excluir
          </CardDescription>
          <Separator className="mt-10" />
          <CardContent className="pt-10 pl-4 pb-3">
            <div className="grid max-w-sm gap-5 mx-auto">
              <div>
                <Label htmlFor="ids">
                  IDs dos Usuários (separados por vírgula):
                </Label>
                <Input
                  type="text"
                  id="ids"
                  placeholder="Ex: 1, 2, 3"
                  value={ids}
                  onChange={(e) => setIds(e.target.value)}
                  required
                />
              </div>
              <Button
                className="mt-4 w-full"
                onClick={handleFetchUsers}
                disabled={loading || deleting}
              >
                {loading ? "Buscando usuários..." : "Consultar Usuários"}
              </Button>
            </div>

            {userNames.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="space-y-3">
                  <Label>Usuários encontrados:</Label>
                  <ul className="text-sm">
                    {userNames.map((name, index) => (
                      <li key={index} className="list-disc ml-4">
                        {name}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-4 w-full"
                    onClick={handleDeleteUsers}
                    disabled={deleting || loading}
                  >
                    {deleting ? "Excluindo..." : "Excluir Usuários"}
                  </Button>
                </div>
              </>
            )}
            {successMessage && (
              <p className="mt-4 text-center text-sm text-green-600">
                {successMessage}
              </p>
            )}
            {error && (
              <p className="mt-4 text-center text-sm text-red-600">{error}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  )
}
