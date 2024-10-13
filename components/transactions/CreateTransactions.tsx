import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { TransactionTypeSelect } from "../dashboard/create-transactions/TransactionType"
import { PaymentMethodSelect } from "../dashboard/create-transactions/PaymentMethod"
import { CardSelect } from "../dashboard/create-transactions/CardSelect"
import { CreditPaymentTypeSelect } from "../dashboard/create-transactions/CreditPaymentType"
import { DatePicker } from "../dashboard/create-transactions/DatePicker"
import { CurrencyInput } from "../dashboard/create-transactions/CurrencyInput"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { parseCurrencyToFloat } from "@/utils/moneyFormatter"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { parseCookies } from "nookies"
import LottieAnimation from "@/components/ui/loadingAnimation"
import { useNameInput } from "@/utils/nameFormatter"
import { transactionSchema, TransactionFormData } from "@/lib/validation"
import { ChevronRight } from "lucide-react"
import { useRouter } from "next/router"
import { format, addMonths } from "date-fns"

const ERROR_MESSAGES = {
  MIN_VALUE: "O valor mínimo é R$ 1,00",
  CREATE_TRANSACTION: "Erro ao criar transação. Por favor, tente novamente.",
}

const ENDPOINTS = {
  CREATE_PARCELS: "/api/transactions/create-parcels",
  CREATE_TRANSACTIONS: "/api/transactions/create-transactions",
  GET_CARDS: "/api/cards/get-card",
}

interface Card {
  cardId: string
  nomeCartao: string
  bandeira: string
  tipoCartao: "credito" | "debito"
  vencimento: number
}

const CreateTransaction: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const router = useRouter()

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
      nome: "",
      fonte: "",
      creditPaymentType: "a-vista",
      parcelas: "",
      detalhesFonte: "",
    },
  })

  const tipo = watch("tipo")
  const fonte = watch("fonte")
  const creditPaymentType = watch("creditPaymentType")
  const selectedCardId = watch("cardId")

  const fetchCards = useCallback(async () => {
    try {
      const { userId } = parseCookies()
      if (!userId) {
        console.warn("Usuário não autenticado")
        return
      }

      const response = await fetch(`${ENDPOINTS.GET_CARDS}?userId=${userId}`)
      if (!response.ok) {
        if (response.status !== 404) {
          throw new Error("Falha ao buscar cartões")
        }
        setCards([])
        return
      }

      const data = await response.json()
      console.log("Dados dos cartões recebidos:", data)
      setCards(data.cartoes)
    } catch (error) {
      console.error("Erro ao buscar cartões:", error)
      setCards([])
    }
  }, [])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  useEffect(() => {
    if (selectedCardId && fonte === "cartao-credito") {
      const selectedCard = cards.find((card) => card.cardId === selectedCardId)
      if (selectedCard) {
        const nextDueDate = calculateNextDueDate(selectedCard.vencimento)
        const formattedDate = format(nextDueDate, "dd-MM-yyyy")
        console.log("Próxima data de vencimento calculada:", formattedDate)
        setValue("data", formattedDate)
      }
    }
  }, [selectedCardId, fonte, cards, setValue])

  const onSubmit = useCallback(
    async (data: TransactionFormData) => {
      setIsLoading(true)
      setApiError(null)

      try {
        const numericValue = parseCurrencyToFloat(data.valor)
        if (numericValue < 1) throw new Error(ERROR_MESSAGES.MIN_VALUE)

        const { email: emailFromCookie } = parseCookies()
        const isCardTransaction = data.fonte === "cartao-credito"
        const endpoint = isCardTransaction
          ? ENDPOINTS.CREATE_PARCELS
          : ENDPOINTS.CREATE_TRANSACTIONS

        const formattedData = {
          email: emailFromCookie ? decodeURIComponent(emailFromCookie) : "",
          nome: data.nome,
          tipo: data.tipo,
          data: data.data,
          valor: numericValue,
          ...(isCardTransaction
            ? {
                fonte: "cartao-credito" as const,
                cardId: data.cardId,
                numeroParcelas:
                  data.creditPaymentType === "a-prazo"
                    ? parseInt(data.parcelas || "1", 10)
                    : 1,
              }
            : {
                fonte: data.fonte,
                detalhesFonte: data.detalhesFonte,
              }),
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formattedData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Falha ao criar transação")
        }

        reset()
        setIsOpen(false)
        router.reload()
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
    },
    [reset, router]
  )

  const showDetalhesFonte = useMemo(
    () => fonte && fonte !== "cartao-credito",
    [fonte]
  )

  const { handleNameChange } = useNameInput()

  const calculateNextDueDate = (vencimento: number) => {
    const today = new Date()
    const thisMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      vencimento
    )

    if (today > thisMonth) {
      return addMonths(thisMonth, 1)
    }

    return thisMonth
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="ml-12 lg:ml-4 gap-1 border-2">
          Adicionar
          <ChevronRight className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px] max-w-[100vw]
      md:h-auto
      h-screen max-h-screen w-screen
      md:rounded-lg rounded-none
      flex flex-col"
      >
        {isLoading ? (
          <>
            <DialogTitle>Criando transação...</DialogTitle>
            <div className="flex justify-center items-center h-full">
              <LottieAnimation animationPath="/loadingAnimation.json" />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Criar Nova Transação</DialogTitle>
              <DialogDescription>
                Preencha os detalhes abaixo corretamente
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <div className="grid gap-4">
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <div className="grid gap-2">
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        placeholder="Ex: Salário, Aluguel, etc"
                        {...field}
                        onChange={(e) => handleNameChange(e, field)}
                      />
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
                        cards={cards}
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
                      <Label htmlFor="detalhesFonte">Detalhes da Origem</Label>
                      <Input
                        {...field}
                        id="detalhesFonte"
                        placeholder="Detalhes adicionais sobre a origem da transação"
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
                      disabled={fonte === "cartao-credito"}
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
                        creditPaymentType === "a-prazo"
                          ? "Valor Total"
                          : "Valor"
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
