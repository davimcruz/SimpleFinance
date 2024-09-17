import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { GetServerSideProps } from "next"
import Link from "next/link"

import { Inter } from "next/font/google"

import "../../app/globals.css"

import { ThemeProvider } from "@/components/theme/theme-provider"
import { UploadButton } from "@/components/uploadthing"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { verifyToken } from "../api/Auth/jwtAuth"
import Header from "@/components/dashboard/header/header"

const inter = Inter({ subsets: ["latin"] })

interface UserData {
  nome: string
  sobrenome: string
  image?: string 
}

const DashboardPage = () => {
  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [newName, setNewName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [loadingSave, setLoadingSave] = useState(false)
  const [loadingImage, setLoadingImage] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [userImage, setUserImage] = useState("")

  const router = useRouter()

  const handleLogout = () => {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })

    router.push("/auth/signin")
  }

  useEffect(() => {
    const emailFromCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("email="))
      ?.split("=")[1]

    if (!emailFromCookie) {
      throw new Error("Email não encontrado nos cookies")
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `/api/Queries/query?email=${emailFromCookie}`
        )
        if (!response.ok) {
          throw new Error("Erro ao obter dados do usuário")
        }
        const userData: UserData = await response.json() 
        setName(userData.nome)
        setLastName(userData.sobrenome)
        setUserImage(userData.image || "")
      } catch (error) {
        console.error(error)
      }
    }

    fetchUserData()
  }, [])

  const handleSave = async () => {
    if (!newName || !newLastName) {
      return
    }
    try {
      setLoadingSave(true)
      const emailFromCookieEncoded = document.cookie
        .split("; ")
        .find((row) => row.startsWith("email="))
        ?.split("=")[1]

      if (!emailFromCookieEncoded) {
        throw new Error("Email não encontrado nos cookies")
      }

      const emailFromCookie = decodeURIComponent(emailFromCookieEncoded)

      const requestBody = {
        email: emailFromCookie,
        nome: newName,
        sobrenome: newLastName,
      }

      const response = await fetch("/api/Settings/updateName", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar nome e sobrenome")
      } else {
        router.push("/dashboard")
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error("Erro durante o salvamento:", error)
    }
  }

  const saveImage = async () => {
    try {
      setLoadingImage(true)
      const emailFromCookieEncoded = document.cookie
        .split("; ")
        .find((row) => row.startsWith("email="))
        ?.split("=")[1]

      if (!emailFromCookieEncoded) {
        throw new Error("Email não encontrado nos cookies")
      }

      const emailFromCookie = decodeURIComponent(emailFromCookieEncoded)

      const response = await fetch("/api/Settings/saveImage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailFromCookie,
          imageUrl: imageUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar a imagem")
      } else {
        router.push("/dashboard")
        setLoadingImage(false)
      }
    } catch (error) {
      setLoadingImage(false)
      console.log(error)
    }
  }

  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <div className={`${inter.className} flex min-h-screen w-full flex-col`}>
        <Header />
        <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
          <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-2xl ml-1 lg:ml-0 my-4 lg:my-0 font-semibold">
              Configurações
            </h1>
          </div>
          <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[90vw] lg:grid-cols-[250px_1fr]">
            <nav
              className="gap-4 text-sm text-muted-foreground hidden lg:grid"
              x-chunk="dashboard-04-chunk-0"
            >
              <Link href="#" className="font-semibold text-primary">
                Geral
              </Link>
              <Link href="#" onClick={handleLogout}>
                Sair
              </Link>
            </nav>
            <div className="grid gap-6">
              <Card x-chunk="dashboard-04-chunk-1">
                <CardHeader>
                  <CardTitle>Editar Nome</CardTitle>
                  <CardDescription>
                    Para editar seu nome na plataforma você deve preencher ambos
                    os campos abaixo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form>
                    <Input
                      className="mb-4"
                      placeholder="Nome"
                      value={newName}
                      required
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <Input
                      placeholder="Sobrenome"
                      value={newLastName}
                      required
                      onChange={(e) => setNewLastName(e.target.value)}
                    />
                  </form>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button
                    onClick={handleSave}
                    variant="outline"
                    disabled={loadingSave || !newName || !newLastName}
                  >
                    {loadingSave ? "Salvando..." : "Salvar"}
                  </Button>
                </CardFooter>
              </Card>
              <Card x-chunk="dashboard-04-chunk-2">
                <CardHeader>
                  <div className="flex lg:gap-44">
                    <div className="pt-4">
                      <CardTitle>Imagem do Avatar</CardTitle>
                      <CardDescription>
                        Utilize esse espaço para fazer upload do seu avatar que
                        será exibido na plataforma
                      </CardDescription>
                    </div>
                    <Avatar className="w-20 h-20 mt-4 md:ml-auto lg:mt-0">
                      <AvatarImage src={imageUrl}></AvatarImage>
                      <AvatarFallback>SF</AvatarFallback>
                    </Avatar>
                  </div>
                </CardHeader>
                <CardContent>
                  <form className="flex flex-col gap-4">
                    <UploadButton
                      className="mt-6 lg:mt-0 
                      ut-button:bg-zinc-800
                      ut-button:after:bg-zinc-600
                      ut-button:text-white
                      ut-allowed-content:hidden
                      ut-button:font-normal
                      ut-button: text-sm
                       "
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        setImageUrl(res[0].url)
                      }}
                      onUploadError={(error: Error) => {
                        console.log(`Erro: ${error.message}`)
                      }}
                    />
                  </form>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button
                    onClick={saveImage}
                    className="font-semibold"
                    disabled={loadingImage}
                    variant="outline"
                    id="save-image"
                  >
                    {loadingImage ? "Salvando..." : "Salvar"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const isVerified = await verifyToken(ctx)

  if (!isVerified) {
    console.log("Falha na verificação de token")
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}

export default DashboardPage
