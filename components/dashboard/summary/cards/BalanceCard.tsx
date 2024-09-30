import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WalletMinimal } from "lucide-react"

interface BalanceCardProps {
  balanceThisMonth: string 
  balanceDifference: string 
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  balanceThisMonth,
  balanceDifference,
}) => {
  return (
    <Card x-chunk="dashboard-01-chunk-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Saldo</CardTitle>
        <WalletMinimal className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{balanceThisMonth}</div>{" "}
        <p className="text-xs text-muted-foreground">
          {balanceDifference} em comparação ao mês anterior{" "}
        </p>
      </CardContent>
    </Card>
  )
}

export default BalanceCard
