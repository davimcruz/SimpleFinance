import ManageUsersComponent from "@/components/admin/manageUsersComponent"
import CreateBudgetsComponent from "@/components/admin/createBudgetsComponent"
import { ModeToggle } from "@/components/theme/toggleTheme"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { GetServerSidePropsContext } from "next"
import { parseCookies } from "nookies"
import jwt from "jsonwebtoken"
import "../../app/globals.css"
import TestBudgetComparison from "@/components/admin/testBudgetComparison"


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
  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <div className="flex min-h-screen flex-col items-center justify-between p-24">
        <main className="flex flex-col items-center justify-center flex-1 gap-8 px-4 py-16 lg:px-0">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <div className="flex flex-col lg:flex-row gap-8">
            <ManageUsersComponent />
            <CreateBudgetsComponent />
            <TestBudgetComparison />
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}
