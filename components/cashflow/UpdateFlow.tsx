import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { parseCookies } from "nookies"
import LottieAnimation from "@/components/ui/loadingAnimation"
import { monthNames } from "@/utils/monthNames"
import { updateFlowSchema } from "@/lib/validation"
import {
  formatToCurrency,
  parseCurrencyToFloat,
  handleCurrencyInput,
} from "@/utils/moneyFormatter"

const UpdateFlow = () => {
  const [monthlyValues, setMonthlyValues] = useState<{
    [key: number]: { receitaOrcada: string; despesaOrcada: string }
  }>({})
  const [budgetError, setBudgetError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const router = useRouter()

  const currentMonth = new Date().getMonth() + 1

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
      const response = await fetch(`/api/cashflow/get-flow?userId=${userId}`)
      if (!response.ok) {
        throw new Error("Falha ao buscar fluxo de caixa")
      }
      const data = await response.json()
      const budgets: {
        [key: number]: { receitaOrcada: string; despesaOrcada: string }
      } = {}
      data.flows.forEach(
        (item: { mes: number; receitaOrcada: number; despesaOrcada: number }) => {
          if (item.mes >= currentMonth) {
            budgets[item.mes] = {
              receitaOrcada: formatToCurrency(item.receitaOrcada),
              despesaOrcada: formatToCurrency(item.despesaOrcada),
            }
          }
        }
      )
      setMonthlyValues(budgets)
    } catch (error) {
      console.error("Erro ao buscar fluxo de caixa:", error)
      setBudgetError("Erro ao carregar fluxo de caixa existente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (
    month: number,
    type: "receitaOrcada" | "despesaOrcada",
    value: string
  ) => {
    let formattedValue =
      value.trim() === "" ? "R$ 0,00" : handleCurrencyInput(value)

    setMonthlyValues((prev) => ({
      ...prev,
      [month]: {
        ...prev[month],
        [type]: formattedValue,
      },
    }))
  }

  const handleUpdateBudget = async () => {
    if (userId === null) {
      setBudgetError("Usuário não autenticado.")
      return
    }

    setBudgetError(null)
    setIsSubmitting(true)

    try {
      const flow = Object.entries(monthlyValues).reduce(
        (acc, [month, values]) => {
          acc[month] = {
            receitaOrcada: parseCurrencyToFloat(values.receitaOrcada),
            despesaOrcada: parseCurrencyToFloat(values.despesaOrcada),
          }
          return acc
        },
        {} as {
          [key: string]: { receitaOrcada: number; despesaOrcada: number }
        }
      )

      const data = { userId, flow }
      updateFlowSchema.parse(data)

      const response = await fetch("/api/cashflow/update-flow", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar fluxo de caixa.")
      }

      router.push("/dashboard/cashflow")
    } catch (error: any) {
      if (error.errors) {
        setBudgetError(error.errors.map((e: any) => e.message).join(", "))
      } else {
        setBudgetError(error.message)
      }
      setIsSubmitting(false)
    }
  }

  const handleRedirect = () => {
    router.push("/dashboard/cashflow")
  }

  const getGridColumns = (monthCount: number) => {
    if (monthCount <= 3) return 1
    if (monthCount === 4) return 2
    return Math.ceil(monthCount / 2)
  }

  return (
    <Card className="w-[90vw] lg:w-[800px] flex-row">
      <CardTitle className="pl-6 pt-6">
        Atualizar fluxo de caixa orçado
      </CardTitle>
      <CardDescription className="pl-6 pt-2">
        Atualize os campos com os novos valores que você espera ganhar e gastar nos próximos meses.
      </CardDescription>
      <Separator className="mt-10" />
      <CardContent className="pt-10 pl-4 pb-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <LottieAnimation animationPath="/loadingAnimation.json" />
          </div>
        ) : isSubmitting ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <LottieAnimation animationPath="/loadingAnimation.json" />
            <p className="mt-4 text-center">Atualizando fluxo de caixa...</p>
          </div>
        ) : (
          <div className="grid gap-5 mx-auto">
            {(() => {
              const availableMonths = Array.from(
                { length: 12 - currentMonth + 1 },
                (_, i) => currentMonth + i
              )
              const columns = getGridColumns(availableMonths.length)

              return (
                <div
                  className={`grid grid-cols-1 md:grid-cols-${columns} gap-x-8 gap-y-2`}
                  style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  }}
                >
                  {availableMonths.map((month) => (
                    <div key={month} className="flex flex-col gap-2 mb-4">
                      <Label className="text-center font-semibold">
                        {monthNames[month - 1]}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`receita-${month}`} className="w-20">
                          Receita:
                        </Label>
                        <Input
                          type="text"
                          id={`receita-${month}`}
                          value={
                            monthlyValues[month]?.receitaOrcada || "R$ 0,00"
                          }
                          onChange={(e) =>
                            handleInputChange(
                              month,
                              "receitaOrcada",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`despesa-${month}`} className="w-20">
                          Despesa:
                        </Label>
                        <Input
                          type="text"
                          id={`despesa-${month}`}
                          value={
                            monthlyValues[month]?.despesaOrcada || "R$ 0,00"
                          }
                          onChange={(e) =>
                            handleInputChange(
                              month,
                              "despesaOrcada",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
            <div className="flex justify-between gap-4 mt-6">
              <Button
                variant={"secondary"}
                className="w-[40%]"
                onClick={handleRedirect}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                className="w-[60%]" 
                onClick={handleUpdateBudget}
                disabled={isSubmitting}
              >
                Atualizar Fluxo de Caixa
              </Button>
            </div>
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

export default UpdateFlow
