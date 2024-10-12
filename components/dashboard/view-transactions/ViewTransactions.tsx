import React, { useState, useCallback, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { TransactionTypeSelect } from "./TransactionType"
import { PaymentMethodSelect } from "./PaymentMethod"
import { CardSelect } from "./CardSelect"
import { DatePicker } from "./DatePicker"
import { CurrencyInput } from "./CurrencyInput"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { parseCurrencyToFloat, formatToCurrency } from "@/utils/moneyFormatter"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { parseCookies } from "nookies"
import LottieAnimation from "@/components/ui/loadingAnimation"
import { transactionSchema, TransactionFormData } from "@/lib/validation"
import { useRouter } from "next/router"

const ENDPOINTS = {
  VIEW_TRANSACTION: "/api/transactions/view-transactions",
  UPDATE_TRANSACTION: "/api/transactions/update-transactions",
  DELETE_TRANSACTION: "/api/transactions/delete-transactions",
  GET_CARDS: "/api/cards/get-card",
}

interface ViewTransactionProps {
  transactionId: string
}

const ViewTransaction: React.FC<ViewTransactionProps> = ({ transactionId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [cards, setCards] = useState<any[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const router = useRouter()

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      nome: "",
      tipo: "despesa",
      fonte: "",
      detalhesFonte: "",
      data: "",
      valor: "",
      cardId: "",
    },
  })

  const tipo = watch("tipo")
  const fonte = watch("fonte")

  const fetchCards = useCallback(async () => {
    try {
      const { userId } = parseCookies()
      const response = await fetch(`${ENDPOINTS.GET_CARDS}?userId=${userId}`)
      if (!response.ok) {
        throw new Error("Falha ao buscar cartões")
      }
      const data = await response.json()
      setCards(data)
    } catch (error) {
      console.error("Erro ao buscar cartões:", error)
      setCards([])
    }
  }, [])

  const fetchTransactionDetails = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(ENDPOINTS.VIEW_TRANSACTION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      })

      if (!response.ok) {
        throw new Error("Erro ao carregar detalhes da transação")
      }

      const data = await response.json()

      const formattedData = {
        nome: data.nome,
        tipo: data.tipo,
        fonte: data.fonte,
        detalhesFonte: data.detalhesFonte || "",
        data: data.data,
        valor: formatToCurrency(data.valor),
        cardId: data.cartao?.cardId || "",
      }

      reset(formattedData)
    } catch (error) {
      setApiError(
        "Erro ao carregar detalhes da transação. Por favor, tente novamente."
      )
    } finally {
      setIsLoading(false)
    }
  }, [transactionId, reset])

  const openDialog = useCallback(() => {
    setIsOpen(true)
    fetchTransactionDetails()
    fetchCards()
  }, [fetchTransactionDetails, fetchCards])

  const submitForm = async () => {
    setIsSubmitting(true)
    setApiError(null)

    try {
      const formData = getValues()

      const updatedData = {
        transactionId,
        nome: formData.nome,
        data: formData.data,
        valor: parseCurrencyToFloat(formData.valor),
        detalhesFonte: formData.detalhesFonte,
      }

      const response = await fetch(ENDPOINTS.UPDATE_TRANSACTION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      })

      if (!response.ok) {
        throw new Error(`Erro na resposta da API: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setIsOpen(false)
        router.reload()
      } else {
        throw new Error(
          result.error || "Erro desconhecido ao atualizar a transação"
        )
      }
    } catch (error) {
      setApiError("Erro ao atualizar a transação. Por favor, tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitClick = (e: React.MouseEvent) => {
    e.preventDefault()
    submitForm()
  }

  const handleDeleteClick = async () => {
    setIsDeleting(true)
    setApiError(null)

    try {
      const response = await fetch(ENDPOINTS.DELETE_TRANSACTION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      })

      if (!response.ok) {
        throw new Error(`Erro na resposta da API: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setIsOpen(false)
        router.reload()
      } else {
        throw new Error(
          result.error || "Erro desconhecido ao excluir a transação"
        )
      }
    } catch (error) {
      setApiError("Erro ao excluir a transação. Por favor, tente novamente.")
    } finally {
      setIsDeleting(false)
    }
  }

  const disabledStyle = { pointerEvents: "none" as const, opacity: 0.6 }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="ml-auto lg:ml-4 gap-1"
        onClick={openDialog}
      >
        Detalhes
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {isSubmitting ? (
            <>
              <DialogHeader>
                <DialogTitle>Editando transação...</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center items-center h-[400px]">
                <LottieAnimation animationPath="/loadingAnimation.json" />
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Editar Transação</DialogTitle>
                <DialogDescription>
                  Preencha as informações que deseja editar
                </DialogDescription>
              </DialogHeader>
              {isLoading ? (
                <div className="flex justify-center items-center h-[400px]">
                  <LottieAnimation animationPath="/loadingAnimation.json" />
                </div>
              ) : (
                <form className="space-y-6 mt-4">
                  <Controller
                    name="nome"
                    control={control}
                    render={({ field }) => (
                      <div className="grid gap-2">
                        <Label htmlFor="nome">Nome da Transação</Label>
                        <Input
                          {...field}
                          id="nome"
                          placeholder="Nome da transação"
                        />
                        {errors.nome && (
                          <span className="text-red-500 text-sm">
                            {errors.nome.message}
                          </span>
                        )}
                      </div>
                    )}
                  />

                  <div style={disabledStyle}>
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
                  </div>

                  <div style={disabledStyle}>
                    <Controller
                      name="fonte"
                      control={control}
                      render={({ field }) => (
                        <PaymentMethodSelect
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          error={errors.fonte?.message}
                          transactionType={tipo}
                        />
                      )}
                    />
                  </div>

                  {fonte === "cartao-credito" && (
                    <div style={disabledStyle}>
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
                    </div>
                  )}

                  {fonte !== "cartao-credito" && (
                    <Controller
                      name="detalhesFonte"
                      control={control}
                      render={({ field }) => (
                        <div className="grid gap-2">
                          <Label htmlFor="detalhesFonte">
                            Detalhes da Origem
                          </Label>
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
                        label="Valor"
                        placeholder="Exemplo: 199,90"
                      />
                    )}
                  />

                  {apiError && <div className="text-red-500">{apiError}</div>}

                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant={"outline"}
                      className="w-full shadow-sm"
                      disabled={isSubmitting || isDeleting}
                      onClick={handleDeleteClick}
                    >
                      {isDeleting ? "Excluindo..." : "Excluir Transação"}
                    </Button>
                    <Button
                      type="button"
                      className="w-full"
                      disabled={isSubmitting}
                      onClick={handleSubmitClick}
                    >
                      Atualizar Transação
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ViewTransaction
