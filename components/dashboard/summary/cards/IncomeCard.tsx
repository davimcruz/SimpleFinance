import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoveUpRight } from "lucide-react"

interface IncomeCardProps {
  monthlyIncome: string
  monthlyIncomeMessage: string
  annualIncome: string
  annualIncomeMessage: string
}

const IncomeCard: React.FC<IncomeCardProps> = ({
  monthlyIncome,
  monthlyIncomeMessage,
  annualIncome,
  annualIncomeMessage,
}) => {
  return (
    <Card x-chunk="dashboard-01-chunk-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Receitas</CardTitle>
        <MoveUpRight className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{monthlyIncome}</div>
        <p className="text-xs text-muted-foreground">
          {monthlyIncomeMessage}
        </p>
        {/* <div className="mt-2 text-sm font-semibold">{annualIncome}</div>
        <p className="text-xs text-muted-foreground">
          {annualIncomeMessage}
        </p> */}
      </CardContent>
    </Card>
  )
}

export default IncomeCard
