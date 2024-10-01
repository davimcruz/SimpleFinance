import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BalanceComparisonTable from "./tables/balanceComparisonsTable"
import IncomeComparisonTable from "./tables/incomeComparisonsTable"

const BudgetTables = () => {
  return (
    <div className="flex justify-center items-start mt-8 w-full">
      <Tabs defaultValue="balance" className="w-full">
        <TabsList className="flex justify-center w-[400px] mx-auto">
          <TabsTrigger value="balance" className="w-full">
            Saldo
          </TabsTrigger>
          <TabsTrigger value="incomes" className="w-full">
            Receita
          </TabsTrigger>
          <TabsTrigger value="expenses" className="w-full">
            Despesa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balance" className="w-full">
          <BalanceComparisonTable />
        </TabsContent>
        <TabsContent value="incomes" className="w-full">
          <IncomeComparisonTable/>
        </TabsContent>
        <TabsContent value="expenses" className="w-full">
          <BalanceComparisonTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BudgetTables
