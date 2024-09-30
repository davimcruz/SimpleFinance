import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Separator } from "../ui/separator"
import { parseCookies } from "nookies"

const TestBudgetComparison = () => {
  const [userId, setUserId] = useState<number | null>(null)
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1) 
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [incomeData, setIncomeData] = useState<any>(null)
  const [expenseData, setExpenseData] = useState<any>(null)
  const [balanceData, setBalanceData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cookies = parseCookies()
    const userIdCookie = cookies.userId ? parseInt(cookies.userId) : null
    setUserId(userIdCookie)
  }, [])

  const handleFetchData = async () => {
    if (!userId) {
      setError("Usuário não autenticado.")
      return
    }
    setLoading(true)
    setError(null)

    try {
      const incomeResponse = await fetch(
        `/api/Budget/Comparisons/budgetIncome?userId=${userId}&month=${month}&year=${year}`,
        { method: "GET" }
      )
      const incomeResult = await incomeResponse.json()

      const expenseResponse = await fetch(
        `/api/Budget/Comparisons/budgetExpense?userId=${userId}&month=${month}&year=${year}`,
        { method: "GET" }
      )
      const expenseResult = await expenseResponse.json()

      const balanceResponse = await fetch(
        `/api/Budget/Comparisons/budgetBalance?userId=${userId}&month=${month}&year=${year}`,
        { method: "GET" }
      )
      const balanceResult = await balanceResponse.json()

      setIncomeData(incomeResult)
      setExpenseData(expenseResult)
      setBalanceData(balanceResult)
    } catch (err: any) {
      setError("Erro ao buscar dados.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-[90vw] lg:w-[400px] flex-row">
      <CardHeader className="flex flex-col items-center">
        <CardTitle className="text-2xl pt-10">Testar Comparações</CardTitle>
      </CardHeader>
      <CardContent className="pt-10 pl-4 pb-3">
        <div className="grid max-w-sm gap-5 mx-auto">
          <Label htmlFor="month">Mês</Label>
          <input
            className="border p-2 rounded"
            type="number"
            id="month"
            min="1"
            max="12"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
          <Label htmlFor="year">Ano</Label>
          <input
            className="border p-2 rounded"
            type="number"
            id="year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
          <Button className="mt-4 w-full" onClick={handleFetchData}>
            {loading ? "Carregando..." : "Testar Comparações"}
          </Button>
        </div>

        <Separator className="mt-10" />

        {error && <p className="text-red-600">{error}</p>}

        {incomeData && (
          <div className="mt-4">
            <h3 className="font-bold">Receitas</h3>
            <p>Orçamento: {incomeData.budget}</p>
            <p>Receitas: {incomeData.income}</p>
            <p>{incomeData.comparison}</p>
          </div>
        )}

        {expenseData && (
          <div className="mt-4">
            <h3 className="font-bold">Despesas</h3>
            <p>Orçamento: {expenseData.budget}</p>
            <p>Despesas: {expenseData.expense}</p>
            <p>{expenseData.comparison}</p>
          </div>
        )}

        {balanceData && (
          <div className="mt-4">
            <h3 className="font-bold">Saldo (Receita - Despesa)</h3>
            <p>Orçamento: {balanceData.budget}</p>
            <p>Saldo: {balanceData.balance}</p>
            <p>{balanceData.comparison}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TestBudgetComparison
