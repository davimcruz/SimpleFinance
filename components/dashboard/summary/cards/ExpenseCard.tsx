import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownUp } from "lucide-react"

interface ExpenseCardProps {
  annualExpense: string
  annualExpenseMessage: string
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  annualExpense,
  annualExpenseMessage,
}) => {
  return (
    <Card x-chunk="dashboard-01-chunk-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Despesas</CardTitle>
        <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{annualExpense}</div>
        <p className="text-xs text-muted-foreground">
          {annualExpenseMessage}
        </p>
      </CardContent>
    </Card>
  )
}

export default ExpenseCard
