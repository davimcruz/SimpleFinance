import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card"
import { Separator } from "../ui/separator"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { parseCookies } from "nookies"

const CreateBudgetsComponent = () => {
  const [monthlyValue, setMonthlyValue] = useState("")
  const [monthlyValues, setMonthlyValues] = useState<number[]>(
    Array(12).fill(0)
  )
  const [customizing, setCustomizing] = useState(false)
  const [budgetSuccessMessage, setBudgetSuccessMessage] = useState<
    string | null
  >(null)
  const [budgetError, setBudgetError] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
    const cookies = parseCookies()
    const userIdCookie = cookies.userId ? parseInt(cookies.userId) : null
    setUserId(userIdCookie)
  }, [])

  const handleCreateBudget = async () => {
    if (userId === null) {
      setBudgetError("Usuário não autenticado.")
      return
    }

    setBudgetError(null)
    setBudgetSuccessMessage(null)

    const values = customizing
      ? monthlyValues
      : Array(12).fill(parseFloat(monthlyValue))
    const allPositive = values.every((value) => value > 0)

    if (!allPositive) {
      setBudgetError("Todos os valores devem ser positivos.")
      return
    }

    try {
      const orderedValues = [...values]

      const response = await fetch("/api/Budget/createBudget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, orcamentoAnualPorMes: orderedValues }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Erro ao criar orçamento.")
      }

      const data = await response.json()
      setBudgetSuccessMessage(data.message || "Orçamento criado com sucesso!")
      setMonthlyValue("")
      setMonthlyValues(Array(12).fill(0))
      setCustomizing(false)
    } catch (error: any) {
      setBudgetError(error.message)
    }
  }

  return (
    <Card className="w-[90vw] lg:w-[400px] flex-row">
      <CardTitle className="flex text-2xl pt-10 items-center justify-center">
        Criar Orçamento
      </CardTitle>
      <CardDescription className="pt-4 text-center">
        Insira o valor do orçamento mensal ou personalize para cada mês
      </CardDescription>
      <Separator className="mt-10" />
      <CardContent className="pt-10 pl-4 pb-3">
        <div className="grid max-w-sm gap-5 mx-auto">
          {!customizing ? (
            <div>
              <Label htmlFor="monthlyValue">Valor Mensal do Orçamento:</Label>
              <Input
                className="mt-2"
                type="number" 
                id="monthlyValue"
                placeholder="Ex: 500.00"
                value={monthlyValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMonthlyValue(e.target.value)
                }
                required
              />
              <Button
                className="mt-4 w-full"
                onClick={() => setCustomizing(true)}
              >
                Personalizar Valores
              </Button>
            </div>
          ) : (
            <div>
              <Label>Valores Mensais do Orçamento:</Label>
              {monthlyValues.map((value, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <Label htmlFor={`month-${index}`} className="w-20">
                    Mês {index + 1}:
                  </Label>
                  <Input
                    type="number" // Alterado para "text"
                    id={`month-${index}`}
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newValues = [...monthlyValues]
                      newValues[index] = parseFloat(e.target.value)
                      setMonthlyValues(newValues)
                    }}
                  />
                </div>
              ))}
              <Button
                className="mt-4 w-full"
                onClick={() => setCustomizing(false)}
              >
                Confirmar Valores
              </Button>
            </div>
          )}
          <Button className="mt-4 w-full" onClick={handleCreateBudget}>
            Criar Orçamento
          </Button>
        </div>
        {budgetSuccessMessage && (
          <p className="mt-4 text-center text-sm text-green-600">
            {budgetSuccessMessage}
          </p>
        )}
        {budgetError && (
          <p className="mt-4 text-center text-sm text-red-600">{budgetError}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default CreateBudgetsComponent
