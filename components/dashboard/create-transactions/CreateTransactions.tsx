import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { TransactionTypeSelect } from "./TransactionType"
import { PaymentMethodSelect } from "./PaymentMethod"
import { CardSelect } from "./CardSelect"
import { CreditPaymentTypeSelect } from "./CreditPaymentType"
import { DatePicker } from "./DatePicker"
import { CurrencyInput } from "./CurrencyInput"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { parseCurrencyToFloat } from "@/utils/moneyFormatter"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { parseCookies } from "nookies"
import LottieAnimation from "@/components/ui/loadingAnimation"

const ERROR_MESSAGES = {
  MIN_VALUE: "O valor mínimo é R$ 1,00",
  FETCH_CARDS: "Erro ao carregar cartões. Por favor, tente novamente.",
  CREATE_TRANSACTION: "Erro ao criar transação. Por favor, tente novamente.",
}

const ENDPOINTS = {
  CREATE_PARCELS: "/api/transactions/create-parcels",
  CREATE_TRANSACTIONS: "/api/transactions/create-transactions",
  GET_CARDS: "/api/cards/get-card",
}

const transactionSchema = z.object({
  nome: z.string().min(1, { message: "Nome é obrigatório" }),
  tipo: z.enum(["receita", "despesa"] as const, {
    message: "Tipo deve ser 'receita' ou 'despesa'",
  }),
  fonte: z.string().min(1, { message: "Fonte é obrigatória" }),
  data: z.string().refine(
    (date) => {
      const ddMMyyyy = /^\d{2}-\d{2}-\d{4}$/.test(date)
      const isoFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(date)
      return ddMMyyyy || isoFormat
    },
    {
      message: "Data deve estar no formato DD-MM-YYYY ou ISO (yyyy-mm-ddTHH:MM:SS.sssZ)",
    }
  ),
  valor: z.string().refine(
    (value) => {
      const numericValue = parseCurrencyToFloat(value)
      return numericValue >= 1
    },
    {
      message: ERROR_MESSAGES.MIN_VALUE,
    }
  ),
  cardId: z.string().uuid({ message: "cardId deve ser um UUID válido" }).optional(),
  creditPaymentType: z.enum(["a-vista", "a-prazo"] as const).optional(),
  parcelas: z.string().optional(),
  detalhesFonte: z.string().optional(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface Card {
  cardId: string
  nomeCartao: string
  bandeira: string
  tipoCartao: "credito" | "debito"
}

const CreateTransaction: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [cards, setCards] = useState<Card[]>([])

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      fonte: "",
      creditPaymentType: "a-vista",
      parcelas: "",
    },
  })

  const tipo = watch("tipo")
  const fonte = watch("fonte")
  const creditPaymentType = watch("creditPaymentType")

  const fetchCards = useCallback(async () => {
    try {
      const cookies = parseCookies()
      const userId = cookies.userId
      const response = await fetch(`${ENDPOINTS.GET_CARDS}?userId=${userId}`)
      if (!response.ok) {
        throw new Error("Falha ao buscar cartões")
      }
      const data = await response.json()
      setCards(data.cartoes)
    } catch (error) {
      console.error("Erro ao buscar cartões:", error)
      setApiError(ERROR_MESSAGES.FETCH_CARDS)
    }
  }, [])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  const onSubmit = useCallback(async (data: TransactionFormData) => {
    setIsLoading(true)
    setApiError(null)

    try {
      const numericValue = parseCurrencyToFloat(data.valor)
      if (numericValue < 1) {
        throw new Error(ERROR_MESSAGES.MIN_VALUE)
      }

      const cookies = parseCookies()
      const emailFromCookie = cookies.email ? decodeURIComponent(cookies.email) : ""

      const isCardTransaction = data.fonte === "cartao-credito"
      const endpoint = isCardTransaction
        ? ENDPOINTS.CREATE_PARCELS
        : ENDPOINTS.CREATE_TRANSACTIONS

      const formattedData = {
        email: emailFromCookie,
        nome: data.nome,
        tipo: data.tipo,
        data: data.data,
        valor: numericValue,
        ...(isCardTransaction
          ? {
              fonte: "cartao-credito" as const,
              cardId: data.cardId,
              numeroParcelas: data.creditPaymentType === "a-prazo" ? parseInt(data.parcelas || "1", 10) : 1,
            }
          : {
              fonte: data.fonte,
              detalhesFonte: data.detalhesFonte,
            }),
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha ao criar transação")
      }

      const responseData = await response.json()
      console.log("Resposta da API:", responseData)

      reset()
      setIsOpen(false)
    } catch (error) {
      console.error("Erro ao criar transação:", error)
      setApiError(
        error instanceof Error
          ? error.message
          : ERROR_MESSAGES.CREATE_TRANSACTION
      )
    } finally {
      setIsLoading(false)
    }
  }, [reset, setIsOpen])

  const showDetalhesFonte = useMemo(() => fonte && fonte !== "cartao-credito", [fonte])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Criar Nova Transação</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <LottieAnimation animationPath="/loadingAnimation.json" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Criar Nova Transação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4">
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <div className="grid gap-2">
                      <Label htmlFor="nome">Nome da Transação</Label>
                      <Input {...field} id="nome" placeholder="Nome da transação" />
                      {errors.nome && (
                        <span className="text-red-500 text-sm">
                          {errors.nome.message}
                        </span>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <TransactionTypeSelect
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.tipo?.message}
                    />
                  )}
                />

                {tipo && (
                  <Controller
                    name="fonte"
                    control={control}
                    render={({ field }) => (
                      <PaymentMethodSelect
                        value={field.value || ""} 
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.fonte?.message}
                        transactionType={tipo}
                      />
                    )}
                  />
                )}
              </div>

              {fonte === "cartao-credito" && (
                <div className="grid gap-4">
                  <Controller
                    name="cardId"
                    control={control}
                    render={({ field }) => (
                      <CardSelect
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.cardId?.message}
                      />
                    )}
                  />

                  <Controller
                    name="creditPaymentType"
                    control={control}
                    render={({ field }) => (
                      <CreditPaymentTypeSelect
                        paymentType={field.value || "a-vista"}
                        onPaymentTypeChange={field.onChange}
                        installments={watch("parcelas") || ""}
                        onInstallmentsChange={(e) =>
                          setValue("parcelas", e.target.value)
                        }
                        onBlur={field.onBlur}
                        error={{
                          paymentType: errors.creditPaymentType?.message,
                          installments: errors.parcelas?.message,
                        }}
                      />
                    )}
                  />
                </div>
              )}

              {showDetalhesFonte && (
                <Controller
                  name="detalhesFonte"
                  control={control}
                  render={({ field }) => (
                    <div className="grid gap-2">
                      <Label htmlFor="detalhesFonte">
                        Detalhes da Fonte (opcional)
                      </Label>
                      <Input
                        {...field}
                        id="detalhesFonte"
                        placeholder="Detalhes adicionais"
                      />
                      {errors.detalhesFonte && (
                        <span className="text-red-500 text-sm">
                          {errors.detalhesFonte.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              )}

              <div className="grid gap-4">
                <Controller
                  name="data"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.data?.message}
                    />
                  )}
                />

                <Controller
                  name="valor"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.valor?.message}
                      label={
                        creditPaymentType === "a-prazo" ? "Valor Total" : "Valor"
                      }
                      placeholder={
                        creditPaymentType === "a-prazo"
                          ? "Exemplo: 499,90"
                          : "Exemplo: 199,90"
                      }
                    />
                  )}
                />
              </div>

              {apiError && <div className="text-red-500">{apiError}</div>}

              <Button type="submit" className="w-full">
                Criar Transação
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default React.memo(CreateTransaction)