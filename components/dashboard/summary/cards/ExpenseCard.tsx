import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownUp } from "lucide-react"

interface ExpenseCardProps {
  monthlyExpense: string
  monthlyExpenseMessage: string
  annualExpense: string
  annualExpenseMessage: string
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  monthlyExpense,
  monthlyExpenseMessage,
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
        <div className="text-2xl font-bold">{monthlyExpense}</div>
        <p className="text-xs text-muted-foreground">
          {monthlyExpenseMessage}
        </p>
        {/* <div className="mt-2 text-sm font-semibold">{annualExpense}</div>
        <p className="text-xs text-muted-foreground">
          {annualExpenseMessage}
        </p> */}
      </CardContent>
    </Card>
  )
}

export default ExpenseCard
