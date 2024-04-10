import { useEffect, useState } from "react"
import { Activity, DollarSign, MoveDownRight, MoveUpRight } from "lucide-react"
import "../../app/globals.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const Summary = () => {
  const [totalBalance, setTotalBalance] = useState<string>("")
  const [totalAvailable, setTotalAvailable] = useState<string>("")
  const [totalIncome, setTotalIncome] = useState<string>("")
  const [totalExpense, setTotalExpense] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchTotalBalance = async () => {
      try {
        const response = await fetch("/api/Transactions/transactionsSummary")
        const data = await response.json()

        const totalBalanceString = addThousandSeparator(
          data.totalBalance.toFixed(2).toString()
        )
        const totalAvailableString = addThousandSeparator(
          data.totalAvailable.toFixed(2).toString()
        )
        const totalIncomeString = addThousandSeparator(
          data.totalIncome.toFixed(2).toString()
        )
        const totalExpenseString = addThousandSeparator(
          data.totalExpense.toFixed(2).toString()
        )
        setTotalAvailable(totalAvailableString)
        setTotalIncome(totalIncomeString)
        setTotalExpense(totalExpenseString)
        setTotalBalance(totalBalanceString)
        setLoading(false)
      } catch (error) {
        console.error("Erro ao buscar o total balance:", error)
        setLoading(false)
      }
    }

    fetchTotalBalance()
  }, [])

  const addThousandSeparator = (value: string) => {
    return value.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      {loading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : (
        <>
          <Card x-chunk="dashboard-01-chunk-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Disponível
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{`R$ ${totalAvailable}`}</div>
              <p className="text-xs text-muted-foreground">
                +20.1% em comparação ao mês anterior
              </p>
            </CardContent>
          </Card>
          <Card x-chunk="dashboard-01-chunk-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <MoveUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{`R$ ${totalIncome}`}</div>
              <p className="text-xs text-muted-foreground">
                +180.1% em comparação ao mês anterior
              </p>
            </CardContent>
          </Card>
          <Card x-chunk="dashboard-01-chunk-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <MoveDownRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{`R$ ${totalExpense}`}</div>
              <p className="text-xs text-muted-foreground">
                +19% em comparação ao mês anterior
              </p>
            </CardContent>
          </Card>
          <Card x-chunk="dashboard-01-chunk-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Volume Transacionado
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{`R$ ${totalBalance}`}</div>
              <p className="text-xs text-muted-foreground">
                +43% em comparação ao mês anterior
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// Componente Skeleton para o Card
const SkeletonCard = () => (
  <Skeleton className="rounded-lg shadow-md p-4 h-[125px]"></Skeleton>
)

export default Summary
