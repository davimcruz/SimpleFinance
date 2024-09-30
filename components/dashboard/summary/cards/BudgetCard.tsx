import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownUp } from "lucide-react"

interface BudgetCardProps {
  totalOrcamento: number
  mesAtual: string
}

const BudgetCard: React.FC<BudgetCardProps> = ({
  totalOrcamento,
  mesAtual,
}) => {
  const formattedBudget = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(totalOrcamento)

  return (
    <Card x-chunk="dashboard-01-chunk-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Orçamento</CardTitle>
        <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedBudget}</div>{" "}
        <p className="text-xs text-muted-foreground">
          Orçamento do mês de {mesAtual}
        </p>
      </CardContent>
    </Card>
  )
}

export default BudgetCard
