import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { parseCookies } from "nookies"
import LottieAnimation from "@/components/ui/loadingAnimation"
import { monthNames } from "@/utils/monthNames"
import { z } from "zod"
import {
  formatToCurrency,
  parseCurrencyToFloat,
  handleCurrencyInput,
} from "@/utils/moneyFormatter"

const updateBudgetSchema = z.object({
  userId: z.number().int().positive(),
  mes: z.number().int().min(1).max(12),
  valor: z.number().positive(),
  ano: z.number().int().positive(),
})

const UpdateBudget = () => {
  const [monthlyValues, setMonthlyValues] = useState<string[]>(
    Array(12).fill("R$ 0,00")
  )
  const [budgetSuccessMessage, setBudgetSuccessMessage] = useState<
    string | null
  >(null)
  const [budgetError, setBudgetError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const cookies = parseCookies()
    const userIdCookie = cookies.userId ? parseInt(cookies.userId) : null
    setUserId(userIdCookie)

    if (userIdCookie) {
      fetchBudgets(userIdCookie)
    }
  }, [])

  const fetchBudgets = async (userId: number) => {
    try {
      const response = await fetch(`/api/budget/get-budgets?userId=${userId}`)
      if (!response.ok) {
        throw new Error("Falha ao buscar orçamentos")
      }
      const data = await response.json()
      const budgets = data.orcamentos.map((item: { valor: number }) =>
        formatToCurrency(item.valor)
      )
      setMonthlyValues(budgets)
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error)
      setBudgetError("Erro ao carregar orçamentos existentes.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (index: number, value: string) => {
    const formattedValue = handleCurrencyInput(value)
    const newValues = [...monthlyValues]
    newValues[index] = formattedValue
    setMonthlyValues(newValues)
  }

  const handleUpdateBudget = async () => {
    if (userId === null) {
      setBudgetError("Usuário não autenticado.")
      return
    }

    setBudgetError(null)
    setBudgetSuccessMessage(null)
    setIsLoading(true)

    const currentYear = new Date().getFullYear()

    try {
      const updatePromises = monthlyValues.map((valor, index) => {
        const monthData = {
          userId,
          mes: index + 1,
          valor: parseCurrencyToFloat(valor),
          ano: currentYear,
        }

        try {
          updateBudgetSchema.parse(monthData)
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new Error(
              `Erro de validação para o mês ${index + 1}: ${
                error.errors[0].message
              }`
            )
          }
        }

        return fetch("/api/budget/update-budget", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(monthData),
        })
      })

      const responses = await Promise.all(updatePromises)

      const allSuccessful = responses.every((response) => response.ok)

      if (!allSuccessful) {
        throw new Error("Erro ao atualizar um ou mais orçamentos mensais.")
      }

      setBudgetSuccessMessage("Orçamentos atualizados com sucesso!")

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
    router.push("/dashboard/budgets")
  }

  return (
    <Card className="w-[90vw] lg:w-[800px] flex-row">
      <CardTitle className="flex text-2xl pt-10 items-center justify-center">
        Atualizar orçamento
      </CardTitle>
      <Separator className="mt-10" />
      <CardContent className="pt-10 pl-4 pb-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <LottieAnimation animationPath="/loadingAnimation.json" />
          </div>
        ) : (
          <div className="grid gap-5 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              <div>
                {monthlyValues.slice(0, 6).map((value, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <Label
                      htmlFor={`month-${index}`}
                      className="w-28 text-right mr-4"
                    >
                      {monthNames[index]}
                    </Label>
                    <Input
                      type="text"
                      id={`month-${index}`}
                      value={value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange(index, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
              <div>
                {monthlyValues.slice(6).map((value, index) => (
                  <div key={index + 6} className="flex items-center gap-2 mb-2">
                    <Label
                      htmlFor={`month-${index + 6}`}
                      className="w-28 text-right mr-4"
                    >
                      {monthNames[index + 6]}
                    </Label>
                    <Input
                      type="text"
                      id={`month-${index + 6}`}
                      value={value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange(index + 6, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between gap-4 mt-6">
              <Button
                variant={"secondary"}
                className="w-[40%]"
                onClick={handleRedirect}
              >
                Cancelar
              </Button>
              <Button className="w-[60%]" onClick={handleUpdateBudget}>
                Atualizar Orçamento
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
