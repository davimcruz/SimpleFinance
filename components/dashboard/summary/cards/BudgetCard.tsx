import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface BudgetCardProps {
  userId: string
}

const BudgetCard: React.FC<BudgetCardProps> = ({ userId }) => {
  const [totalOrcamento, setTotalOrcamento] = useState<number>(0)
  const [mesAtual, setMesAtual] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  const SkeletonCard = () => (
    <Skeleton className="rounded-lg shadow-md p-4 h-[125px]" />
  )
  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        const response = await fetch(
          `/api/cashflow/get-monthly?userId=${userId}`
        )
        if (!response.ok) {
          throw new Error("Erro ao buscar dados do orçamento")
        }
        const data = await response.json()
        if (data) {
          setTotalOrcamento(data.saldoOrcado || 0)
          setMesAtual(data.mesAtual || "")
        } else {
          setTotalOrcamento(0)
          setMesAtual("")
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchBudgetData()
  }, [userId])

  const formattedBudget = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(totalOrcamento)

  if (loading) {
    return <SkeletonCard />
  }

  if (error) {
    return (
      <Card x-chunk="dashboard-01-chunk-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Orçamento</CardTitle>
          <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ 0,00</div>
          <p className="text-xs text-muted-foreground">
            Nenhum fluxo de caixa encontrado
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card x-chunk="dashboard-01-chunk-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Orçamento</CardTitle>
        <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedBudget}</div>
        <p className="text-xs text-muted-foreground">
          Orçamento do mês de {mesAtual}
        </p>
      </CardContent>
    </Card>
  )
}

export default BudgetCard
