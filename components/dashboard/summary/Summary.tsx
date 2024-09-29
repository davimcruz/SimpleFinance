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
  const [budgetData, setBudgetData] = useState<{
    totalOrcamento: number
    mesAtual: string
  } | null>(null)
  const [loading, setLoading] = useState<boolean>(!initialData)

  useEffect(() => {
    if (!initialData) {
      fetchAllData()
    }
  }, [initialData])

  const fetchAllData = async () => {
    try {
      const cookies = parseCookies()
      const userId = cookies.userId

      if (!userId) {
        console.error("userId não encontrado nos cookies")
        return
      }

      const [summaryResponse, budgetResponse] = await Promise.all([
        fetchSummaryData(),
        fetch(`/api/Queries/queryCurrentBudget?userId=${userId}`),
      ])

      const summaryData = await summaryResponse
      const budgetData = await budgetResponse.json()

      if (
        summaryData &&
        budgetData &&
        typeof budgetData.totalOrcamento === "number"
      ) {
        setSummaryData(summaryData)
        setBudgetData(budgetData)
      } else {
        console.error("Erro ao carregar os dados")
      }

      setLoading(false)
    } catch (error) {
      console.error("Erro ao buscar os dados:", error)
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
          <IncomeCard
            totalIncomeThisMonth={summaryData?.totalIncomeThisMonth || ""}
            incomeDifference={summaryData?.incomeDifference || ""}
          />
          <ExpenseCard
            totalExpenseThisMonth={summaryData?.totalExpenseThisMonth || ""}
            expenseDifference={summaryData?.expenseDifference || ""}
          />
          <BalanceCard
            totalAvailableThisMonth={summaryData?.totalAvailableThisMonth || ""}
            balanceDifference={summaryData?.balanceDifference || ""}
          />
          <BudgetCard
            totalOrcamento={budgetData?.totalOrcamento || 0}
            mesAtual={budgetData?.mesAtual || ""}
          />
        </>
      )}
    </div>
  )
}

const SkeletonCard = () => (
  <Skeleton className="rounded-lg shadow-md p-4 h-[125px]" />
)

export default Summary
