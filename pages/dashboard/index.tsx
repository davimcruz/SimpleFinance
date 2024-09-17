import { GetServerSideProps } from "next"
import { Inter } from "next/font/google"
import "../../app/globals.css"
import { ThemeProvider } from "@/components/theme/theme-provider"
import Summary from "@/components/dashboard/summary/Summary"
import TransactionsTable from "@/components/dashboard/table/TransactionsTable"
import FinancesGraph from "@/components/dashboard/graphs/FinancesGraph"
import { getServerSidePropsDashboard } from "@/utils/getServerSideProps"
import { Skeleton } from "@/components/ui/skeleton"
import Header from "@/components/dashboard/header/HeaderComponent"

const inter = Inter({ subsets: ["latin"] })

const DashboardPage = ({
  user,
}: {
  user?: { nome: string; sobrenome: string; image?: string }
}) => {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <div className={`${inter.className} flex min-h-screen w-full flex-col`}>
        <Header userImage={user?.image} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div>
            {!user || !user.nome || !user.sobrenome ? (
              <Skeleton className="h-8 w-[230px]" />
            ) : (
              <h1 className="ml-2 text-2xl font-bold py-2 lg:py-0">
                Olá, {user.nome} {user.sobrenome}
              </h1>
            )}
          </div>
          <Summary initialData={null} />
          <div className="grid lg:max-h-96 gap-4 md:gap-8 xl:grid-cols-3">
            <TransactionsTable />
            <FinancesGraph />
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

export const getServerSideProps: GetServerSideProps =
  getServerSidePropsDashboard

export default DashboardPage
