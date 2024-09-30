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

      console.log("Iniciando busca de dados para resumo e orçamento...")

      const [summaryResponse, budgetResponse] = await Promise.all([
        fetchSummaryData(),
        fetch(`/api/Queries/queryCurrentBudget?userId=${userId}`),
      ])

      const summaryData = await summaryResponse
      const budgetData = await budgetResponse.json()

      console.log("Dados de resumo recebidos:", summaryData)
      console.log("Dados de orçamento recebidos:", budgetData)

      if (
        summaryData &&
        budgetData &&
        typeof budgetData.totalOrcamento === "number"
      ) {
        setSummaryData(summaryData)
        setBudgetData(budgetData)
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
          totalIncomeThisMonth={summaryData?.totalIncomeThisMonth || "0,00"}
          incomeDifference={summaryData?.incomeDifference || "0%"}
        />
        <ExpenseCard
          totalExpenseThisMonth={summaryData?.totalExpenseThisMonth || "0,00"}
          expenseDifference={summaryData?.expenseDifference || "0%"}
        />
        <BalanceCard
          balanceThisMonth={
            summaryData?.balanceThisMonth || "0,00"
          }
          balanceDifference={summaryData?.balanceDifference || "0%"}
        />
        <BudgetCard
          totalOrcamento={budgetData?.totalOrcamento || 0}
          mesAtual={budgetData?.mesAtual || ""}
        />
      </>
    </div>
  )
}

const SkeletonCard = () => (
  <Skeleton className="rounded-lg shadow-md p-4 h-[125px]" />
)

export default Summary
