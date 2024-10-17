import { useEffect, useState } from "react"
import "../../../app/globals.css"
import { fetchSummaryData } from "./summaryCalcs"
import IncomeCard from "./cards/IncomeCard"
import ExpenseCard from "./cards/ExpenseCard"
import BalanceCard from "./cards/BalanceCard"
import BudgetCard from "./cards/BudgetCard"
import { Skeleton } from "@/components/ui/skeleton"
import { SummaryData } from "@/types/types"
import { parseCookies } from "nookies"

interface SummaryProps {
  initialData: SummaryData | null
}

const Summary: React.FC<SummaryProps> = ({ initialData }) => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(
    initialData
  )
  const [flowData, setFlowData] = useState<{
    saldo: number
    mesAtual: string
  } | null>(null)
  const [loading, setLoading] = useState<boolean>(!initialData)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    if (!initialData) {
      fetchAllData()
    }
  }, [initialData])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(false)

      const cookies = parseCookies()
      const userId = cookies.userId

      if (!userId) {
        console.error("userId não encontrado nos cookies")
        setError(true)
        setLoading(false)
        return
      }

      const [summaryResponse, budgetResponse] = await Promise.all([
        fetchSummaryData(),
        fetch(`/api/cashflow/get-monthly?userId=${userId}`),
      ])

      const summaryData = await summaryResponse
      const flowData = await budgetResponse.json()

      if (
        summaryData &&
        flowData &&
        typeof flowData.saldo === "number"
      ) {
        setSummaryData(summaryData)
        setFlowData(flowData)
      } else {
        console.error("Erro ao carregar os dados")
        setError(true)
      }
    } catch (error) {
      console.error("Erro ao buscar os dados:", error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500">
        Erro ao carregar os dados. Tente novamente mais tarde.
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <>
        <IncomeCard
          monthlyIncome={summaryData?.monthlyIncome || "R$ 0,00"}
          monthlyIncomeMessage={summaryData?.monthlyIncomeMessage || ""}
          annualIncome={summaryData?.annualIncome || "R$ 0,00"}
          annualIncomeMessage={summaryData?.annualIncomeMessage || ""}
        />
        <ExpenseCard
          monthlyExpense={summaryData?.monthlyExpense || "R$ 0,00"}
          monthlyExpenseMessage={summaryData?.monthlyExpenseMessage || ""}
          annualExpense={summaryData?.annualExpense || "R$ 0,00"}
          annualExpenseMessage={summaryData?.annualExpenseMessage || ""}
        />
        <BalanceCard
          annualBalance={summaryData?.annualBalance || "R$ 0,00"}
          annualBalanceMessage={summaryData?.annualBalanceMessage || ""}
        />
        <BudgetCard
          totalOrcamento={flowData?.saldo || 0}
          mesAtual={flowData?.mesAtual || ""}
        />
      </>
    </div>
  )
}

const SkeletonCard = () => (
  <Skeleton className="rounded-lg shadow-md p-4 h-[125px]" />
)

export default Summary
