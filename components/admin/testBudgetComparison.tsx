import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Separator } from "../ui/separator"
import { parseCookies } from "nookies"

const TestBudgetComparison = () => {
  const [userId, setUserId] = useState<number | null>(null)
  const [year, setYear] = useState<number>(new Date().getFullYear()) 
  const [budgetData, setBudgetData] = useState<any[]>([]) 
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
      const response = await fetch(
        `/api/budget/comparisons/annual/get-balance?userId=${userId}`,
        { method: "GET" }
      )
      if (!response.ok) {
        throw new Error("Erro ao buscar dados")
      }
      const result = await response.json()
      setBudgetData(result)
    } catch (err: any) {
      setError("Erro ao buscar dados.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-[90vw] lg:w-[600px] flex-row">
      <CardHeader className="flex flex-col items-center">
        <CardTitle className="text-2xl pt-10">
          Testar Comparações Anuais
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-10 pl-4 pb-3">
        <div className="grid max-w-sm gap-5 mx-auto">
          <Label htmlFor="year">Ano</Label>
          <input
            className="border p-2 rounded"
            type="number"
            id="year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
          <Button className="mt-4 w-full" onClick={handleFetchData}>
            {loading ? "Carregando..." : "Testar Comparações Anuais"}
          </Button>
        </div>

        <Separator className="mt-10" />

        {error && <p className="text-red-600">{error}</p>}

        {budgetData.length > 0 && (
          <div className="mt-4">
            <h3 className="font-bold text-xl mb-4">
              Resultado da Comparação Anual
            </h3>
            {budgetData.map((monthData, index) => (
              <div key={index} className="mb-6 p-4 border rounded-lg">
                <p>
                  <strong>Mês:</strong> {monthData.month}
                </p>
                <p>
                  <strong>Orçamento:</strong> R$ {monthData.budget.toFixed(2)}
                </p>
                <p>
                  <strong>Status:</strong> {monthData.status}
                </p>
                <p>
                  <strong>Saldo:</strong> R$ {monthData.balance.toFixed(2)}
                </p>
                <p>
                  <strong>Gap (R$):</strong> R${" "}
                  {monthData.gapMoney.toFixed(2)}
                </p>
                <p>
                  <strong>Gap (%):</strong>{" "}
                  {monthData.gapPercentage}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TestBudgetComparison
