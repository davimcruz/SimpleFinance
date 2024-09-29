import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoveDownRight } from "lucide-react"

interface ExpenseCardProps {
  totalExpenseThisMonth: string
  expenseDifference: string
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  totalExpenseThisMonth,
  expenseDifference,
}) => {
  return (
    <Card x-chunk="dashboard-01-chunk-1">
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
  )
}

export default ExpenseCard
