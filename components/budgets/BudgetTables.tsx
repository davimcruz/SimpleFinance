import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BalanceComparisonTable from "./tables/balanceComparisonsTable"
import IncomeComparisonTable from "./tables/incomeComparisonsTable"
import ExpenseComparisonTable from "./tables/expenseComparisonsTable"

const BudgetTables = () => {
  return (
    <div className="flex justify-center items-start mt-8 w-full">
      <Tabs defaultValue="balance" className="w-full">
        <TabsList className="flex justify-center w-[300px] md:w-[400px] mx-auto bg-white dark:bg-zinc-800 rounded-md shadow-md -mt-2 -mb-6">
          <TabsTrigger
            value="balance"
            className="w-full text-zinc-900 dark:text-white"
          >
            Saldo
          </TabsTrigger>
          <TabsTrigger
            value="incomes"
            className="w-full text-zinc-900 dark:text-white"
          >
            Receita
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="w-full text-zinc-900 dark:text-white"
          >
            Despesa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balance" className="w-full">
          <BalanceComparisonTable />
        </TabsContent>
        <TabsContent value="incomes" className="w-full">
          <IncomeComparisonTable />
        </TabsContent>
        <TabsContent value="expenses" className="w-full">
          <ExpenseComparisonTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BudgetTables
