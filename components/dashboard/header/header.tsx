import { useEffect, useState } from "react"
import Router, { useRouter } from "next/router"
import Link from "next/link"
import { Menu, Wallet } from "lucide-react"
import "../../../app/globals.css"
import { ModeToggle } from "@/components/theme/toggleTheme"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "../../ui/skeleton"
import ProgressBar from "./progress"

const useUserImage = () => {
  const [userImage, setUserImage] = useState("")

  useEffect(() => {
    const fetchUserData = async () => {
      const emailFromCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("email="))
        ?.split("=")[1]

      if (!emailFromCookie) {
        console.error("Email não encontrado nos cookies")
        return
      }

      try {
        const response = await fetch(
          `/api/Queries/query?email=${emailFromCookie}`
        )
        if (!response.ok) throw new Error("Erro ao obter dados do usuário")
        const userData = await response.json()
        setUserImage(userData.image)
      } catch (error) {
        console.error(error)
      }
    }

    fetchUserData()
  }, [])

  return userImage
}

const Header = () => {
  const router = useRouter()
  const userImage = useUserImage()
  const linkClassName = (path: string) => {
    return router.pathname === path
      ? "text-foreground"
      : "text-muted-foreground"
  }

  const handleLogout = () => {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
    Router.push("/auth/signin")
  }

  const handleSettings = () => {
    Router.push("/dashboard/settings")
  }
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-20">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Wallet className="h-6 w-6" />
          <span className="sr-only">Simple Finance</span>
        </Link>
        <Link
          href="/dashboard"
          className={`${linkClassName(
            "/dashboard"
          )} transition-colors hover:text-foreground`}
        >
          Dashboard
        </Link>
        <Link
          href="/dashboard/transactions"
          className={`${linkClassName(
            "/dashboard/transactions"
          )} transition-colors hover:text-foreground`}
        >
          Transações
        </Link>
        <Link
          href="/dashboard/billing"
          className={`${linkClassName(
            "/dashboard/billing"
          )} transition-colors hover:text-foreground`}
        >
          Planos
        </Link>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Navegação do Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Wallet className="h-6 w-6" />
              <span className="sr-only">Simple Finance</span>
            </Link>
            <Link
              href="/dashboard"
              className={`${linkClassName(
                "/dashboard"
              )} transition-colors hover:text-foreground`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/transactions"
              className={`${linkClassName(
                "/dashboard/transactions"
              )} transition-colors hover:text-foreground`}
            >
              Transações
            </Link>
            <Link
              href="/dashboard/billing"
              className={`${linkClassName(
                "/dashboard/billing"
              )} transition-colors hover:text-foreground`}
            >
              Planos
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
         <ProgressBar />
        </div>
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                {!userImage ? (
                  <Skeleton className="h-4 w-4 rounded-full" />
                ) : (
                  <>
                    <AvatarImage src={userImage} />
                    <AvatarFallback>SF</AvatarFallback>
                  </>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSettings}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem>Suporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Header
function setUserImage(image: any) {
  throw new Error("Function not implemented.")
}
