import { useEffect, useState } from "react"
import {
  ArrowDownUp,
  MoveDownRight,
  MoveUpRight,
  WalletMinimal,
} from "lucide-react"
import "../../../app/globals.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchSummaryData, getServerSideProps } from "./summaryCalcs"
import { SummaryData } from "@/types/types"

interface SummaryProps {
  initialData: SummaryData | null
}

const Summary: React.FC<SummaryProps> = ({ initialData }) => {
  const [totalBalance, setTotalBalance] = useState<string>(
    initialData?.totalBalance || ""
  )
  const [totalAvailableThisMonth, setTotalAvailableThisMonth] =
    useState<string>(initialData?.totalAvailableThisMonth || "")
  const [totalIncomeThisMonth, setTotalIncomeThisMonth] = useState<string>(
    initialData?.totalIncomeThisMonth || ""
  )
  const [totalExpenseThisMonth, setTotalExpenseThisMonth] = useState<string>(
    initialData?.totalExpenseThisMonth || ""
  )
  const [balanceDifference, setBalanceDifference] = useState<string>(
    initialData?.balanceDifference || ""
  )
  const [incomeDifference, setIncomeDifference] = useState<string>(
    initialData?.incomeDifference || ""
  )
  const [expenseDifference, setExpenseDifference] = useState<string>(
    initialData?.expenseDifference || ""
  )
  const [loading, setLoading] = useState<boolean>(!initialData)

  useEffect(() => {
    if (!initialData) {
      fetchTotalBalance()
    }
  }, [initialData])

  const fetchTotalBalance = async () => {
    try {
      const data = await fetchSummaryData()

      if (data) {
        setTotalAvailableThisMonth(data.totalAvailableThisMonth)
        setTotalIncomeThisMonth(data.totalIncomeThisMonth)
        setTotalExpenseThisMonth(data.totalExpenseThisMonth)
        setTotalBalance(data.totalBalance)
        setBalanceDifference(data.balanceDifference)
        setIncomeDifference(data.incomeDifference)
        setExpenseDifference(data.expenseDifference)
      }

      setLoading(false)
    } catch (error) {
      console.error("Erro ao buscar o total balance:", error)
      setLoading(false)
    }
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

export { getServerSideProps }
export default Summary
