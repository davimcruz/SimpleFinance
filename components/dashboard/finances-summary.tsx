import { useEffect, useState } from "react"
import { ArrowDownUp, MoveDownRight, MoveUpRight, WalletMinimal } from "lucide-react"
import "../../app/globals.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const Summary = () => {
  const [totalBalance, setTotalBalance] = useState<string>("")
  const [totalAvailableThisMonth, setTotalAvailableThisMonth] =
    useState<string>("")
  const [totalIncomeThisMonth, setTotalIncomeThisMonth] = useState<string>("")
  const [totalExpenseThisMonth, setTotalExpenseThisMonth] = useState<string>("")
  const [balanceDifference, setBalanceDifference] = useState<string>("")
  const [incomeDifference, setIncomeDifference] = useState<string>("")
  const [expenseDifference, setExpenseDifference] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchTotalBalance = async () => {
      try {
        const response = await fetch("/api/Transactions/transactionsSummary")
        const data = await response.json()

        const totalBalanceString = addThousandSeparator(
          data.totalBalance.toFixed(2).toString()
        )
        const totalAvailableThisMonthString = addThousandSeparator(
          data.totalAvailableThisMonth.toFixed(2).toString()
        )
        const totalIncomeThisMonthString = addThousandSeparator(
          data.totalIncomeThisMonth.toFixed(2).toString()
        )
        const totalExpenseThisMonthString = addThousandSeparator(
          data.totalExpenseThisMonth.toFixed(2).toString()
        )
        setTotalAvailableThisMonth(totalAvailableThisMonthString)
        setTotalIncomeThisMonth(totalIncomeThisMonthString)
        setTotalExpenseThisMonth(totalExpenseThisMonthString)
        setTotalBalance(totalBalanceString)

        const balanceDifferenceString =
          data.balanceDifferenceString === "+Infinity%" ||
          data.balanceDifferenceString === "NaN%"
            ? "0%"
            : data.balanceDifferenceString
        const incomeDifferenceString =
          data.incomeDifferenceString === "+Infinity%" ||
          data.incomeDifferenceString === "NaN%"
            ? "0%"
            : data.incomeDifferenceString
        const expenseDifferenceString =
          data.expenseDifferenceString === "+Infinity%" ||
          data.expenseDifferenceString === "NaN%"
            ? "0%"
            : data.expenseDifferenceString

        setBalanceDifference(balanceDifferenceString)
        setIncomeDifference(incomeDifferenceString)
        setExpenseDifference(expenseDifferenceString)

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
              <WalletMinimal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{`R$ ${totalAvailableThisMonth}`}</div>
              <p className="text-xs text-muted-foreground">
                {balanceDifference} em comparação ao mês anterior
              </p>
            </CardContent>
          </Card>
          <Card x-chunk="dashboard-01-chunk-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <MoveUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{`R$ ${totalIncomeThisMonth}`}</div>
              <p className="text-xs text-muted-foreground">
                {incomeDifference} em comparação ao mês anterior
              </p>
            </CardContent>
          </Card>
          <Card x-chunk="dashboard-01-chunk-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <MoveDownRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{`R$ ${totalExpenseThisMonth}`}</div>
              <p className="text-xs text-muted-foreground">
                {expenseDifference} em comparação ao mês anterior
              </p>
            </CardContent>
          </Card>
          <Card x-chunk="dashboard-01-chunk-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Volume Transacionado
              </CardTitle>
              <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{`R$ ${totalBalance}`}</div>
              <p className="text-xs text-muted-foreground">
                Total transacionado em todos os meses
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

const SkeletonCard = () => (
  <Skeleton className="rounded-lg shadow-md p-4 h-[125px]"></Skeleton>
)

export default Summary
