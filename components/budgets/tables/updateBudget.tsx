import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { parseCookies } from "nookies"
import LottieAnimation from "@/components/ui/loadingAnimation"
import { monthNames } from "@/utils/monthNames"

const UpdateBudget = () => {
  const [monthlyValue, setMonthlyValue] = useState("")
  const [monthlyValues, setMonthlyValues] = useState<number[]>(
    Array(12).fill(0)
  )
  const [customizing, setCustomizing] = useState(false)
  const [budgetSuccessMessage, setBudgetSuccessMessage] = useState<
    string | null
  >(null)
  const [budgetError, setBudgetError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const router = useRouter()

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
    setIsLoading(true)

    const values = customizing
      ? monthlyValues
      : Array(12).fill(parseFloat(monthlyValue))
    const allPositive = values.every((value) => value > 0)

    if (!allPositive) {
      setBudgetError("Todos os valores devem ser positivos.")
      setIsLoading(false)
      return
    }

    try {
      const orderedValues = [...values]

      const response = await fetch("/api/budget/create-budget", {
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

      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)

      setTimeout(() => {
        setIsLoading(false)
      }, 3000)
    } catch (error: any) {
      setBudgetError(error.message)
      setIsLoading(false)
    }
  }

  const handleRedirect = () => {
    router.push("/dashboard")
  }

  return (
    <Card className="w-[90vw] lg:w-[400px] flex-row">
      <CardTitle className="flex text-2xl pt-10 items-center justify-center">
        Atualizar orçamento
      </CardTitle>
      <CardDescription className="pt-4 text-center">
        Atualize seu orçamento predefinido
      </CardDescription>
      <Separator className="mt-10" />
      <CardContent className="pt-10 pl-4 pb-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <LottieAnimation animationPath="/loadingAnimation.json" />
          </div>
        ) : (
          <div className="grid max-w-sm gap-5 mx-auto">
            {!customizing ? (
              <div>
                <Label htmlFor="monthlyValue">Valor Mensal:</Label>
                <p className="text-xs text-zinc-400">
                  Este valor será o <strong>mesmo</strong> para todos os meses
                  do ano
                </p>
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
                <p className="text-center mt-4">ou</p>
                <Button
                  className="py-0 w-full font-thin underline"
                  onClick={() => setCustomizing(true)}
                  variant={"link"}
                >
                  Quero definir um valor personalizado para cada mês
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-center -mt-4 mb-4 font-bold">
                  Valores mensais personalizados:
                </p>
                {monthlyValues.map((value, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <Label
                      htmlFor={`month-${index}`}
                      className="w-28 text-right mr-4"
                    >
                      {monthNames[index]}
                    </Label>
                    <Input
                      type="number"
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
                  className="py-0 w-full font-thin underline"
                  onClick={() => setCustomizing(false)}
                  variant={"link"}
                >
                  Quero definir o mesmo valor para todos os meses
                </Button>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <Button
                variant={"secondary"}
                className="mt-4 w-[40%]"
                onClick={handleRedirect}
              >
                Pular Etapa
              </Button>
              <Button className="mt-4 w-[60%]" onClick={handleCreateBudget}>
                Criar Orçamento
              </Button>
            </div>
            {budgetSuccessMessage && (
              <p className="mt-4 text-center text-sm text-green-600">
                {budgetSuccessMessage}
              </p>
            )}
            {budgetError && (
              <p className="mt-4 text-center text-sm text-red-600">
                {budgetError}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default UpdateBudget
