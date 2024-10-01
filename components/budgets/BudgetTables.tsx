import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BalanceComparisonTable from "./tables/balanceComparisonsTable"

const BudgetTables = () => {
  return (
    <div className="flex justify-center items-center mt-8">
   <BalanceComparisonTable/>
    </div>
  )
}

export default BudgetTables