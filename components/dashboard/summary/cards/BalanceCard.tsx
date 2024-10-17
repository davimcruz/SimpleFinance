import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WalletMinimal } from "lucide-react"

interface BalanceCardProps {
  annualBalance: string 
  annualBalanceMessage: string 
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  annualBalance,
  annualBalanceMessage,
}) => {
  return (
    <Card x-chunk="dashboard-01-chunk-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Saldo</CardTitle>
        <WalletMinimal className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{annualBalance}</div>
        <p className="text-xs text-muted-foreground">
          {annualBalanceMessage}
        </p>
      </CardContent>
    </Card>
  )
}

export default BalanceCard
