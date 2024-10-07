import React, { useEffect, useState } from "react"
import { format, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/router"
import { parseCookies } from "nookies"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronRight, Calendar as CalendarIcon } from "lucide-react"

import formatadorValor from "@/utils/valueFormatter"
import LottieAnimation from "../ui/loadingAnimation"

import { z } from "zod"

const transactionSchema = z
  .object({
    nome: z.string().min(1, { message: "Nome é obrigatório" }),
    tipoTransacao: z.enum(["receita", "despesa"], {
      message: "Tipo deve ser 'receita' ou 'despesa'",
    }),
    fonteTransacao: z.string().min(1, { message: "Fonte é obrigatória" }),
    detalhesFonte: z.string().optional(),
    dataTransacao: z.string().refine(
      (date) => {
        const ddMMyyyy = /^\d{2}-\d{2}-\d{4}$/.test(date)
        const isoFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(
          date
        )
        return ddMMyyyy || isoFormat
      },
      {
        message:
          "Data deve estar no formato DD-MM-YYYY ou ISO (yyyy-mm-ddTHH:MM:SS.sssZ)",
      }
    ),
    valor: z
      .string()
      .min(1, { message: "Valor é obrigatório" })
      .refine(
        (val) => {
          const valorValidado = val.replace(/[^0-9,]/g, "")
          const valorSemPontos = valorValidado.replace(/\./g, "")
          const valorComPonto = valorSemPontos.replace(",", ".")
          const valorFloat = parseFloat(valorComPonto)
          return !isNaN(valorFloat) && valorFloat > 0
        },
        { message: "Valor deve ser um número positivo" }
      ),
    cardId: z
      .string()
      .uuid({ message: "Card ID deve ser um UUID válido" })
      .optional(),
    parcelas: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (val === undefined || val === "") return true
          const num = parseInt(val, 10)
          return !isNaN(num) && num >= 1 && num <= 12
        },
        { message: "Número de parcelas deve ser entre 1 e 12" }
      ),
    parcelamento: z
      .enum(["a-vista", "a-prazo"], {
        message: "Parcelamento deve ser 'a-vista' ou 'a-prazo'",
      })
      .optional(),
  })
  .refine(
    (data) => data.fonteTransacao !== "cartao-credito" || Boolean(data.cardId),
    {
      message:
        "Card ID é obrigatório quando o meio de pagamento é Cartão de Crédito",
      path: ["cardId"],
    }
  )

type TransactionFormData = z.infer<typeof transactionSchema>

interface CardType {
  cardId: string
  nomeCartao: string
  bandeira: string
  tipoCartao: "credito" | "debito"
}

const CreateTransaction = () => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [cards, setCards] = useState<CardType[]>([])
  const [isCardSelectVisible, setIsCardSelectVisible] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const cookies = parseCookies()
  const userId = cookies.userId
  const emailFromCookie = cookies.email ? decodeURIComponent(cookies.email) : ""

  const [nome, setNome] = useState<string>("")
  const [tipoTransacao, setTipoTransacao] = useState<
    "receita" | "despesa" | ""
  >("")
  const [fonteTransacao, setFonteTransacao] = useState<string>("")
  const [detalhesFonte, setDetalhesFonte] = useState<string>("")
  const [dataTransacao, setDataTransacao] = useState<string>("")
  const [valorEditado, setValorEditado] = useState<string>("")
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>(
    undefined
  )
  const [parcelamento, setParcelamento] = useState<"a-vista" | "a-prazo">(
    "a-vista"
  )
  const [parcelas, setParcelas] = useState<string>("1")

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch(`/api/cards/get-card?userId=${userId}`)
        const data = await response.json()
        if (Array.isArray(data.cartoes)) {
          setCards(data.cartoes)
        }
      } catch (error) {
        console.error("Erro ao buscar cartões:", error)
      }
    }

    if (userId) {
      fetchCards()
    }
  }, [userId])

  useEffect(() => {
    if (fonteTransacao === "cartao-credito") {
      setIsCardSelectVisible(true)
    } else {
      setIsCardSelectVisible(false)
      setSelectedCardId(undefined)
      setParcelas("1")
      setParcelamento("a-vista")
    }
  }, [fonteTransacao])

  const converterValorParaFloat = (valor: string): number => {
    const valorValidado = valor.replace(/[^0-9,]/g, "")
    const valorSemPontos = valorValidado.replace(/\./g, "")
    const valorComPonto = valorSemPontos.replace(",", ".")
    return parseFloat(valorComPonto)
  }

  const validateData = (): boolean => {
    const formData: TransactionFormData = {
      nome,
      tipoTransacao: tipoTransacao as "receita" | "despesa",
      fonteTransacao,
      detalhesFonte,
      dataTransacao,
      valor: valorEditado,
      cardId: selectedCardId || undefined,
      parcelas: parcelas,
      parcelamento: parcelamento as "a-vista" | "a-prazo",
    }

    const result = transactionSchema.safeParse(formData)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        const fieldName = err.path[0] as string
        fieldErrors[fieldName] = err.message
      })
      setErrors(fieldErrors)
      return false
    }

    setErrors({})
    return true
  }

  const handleSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateData()) {
      return
    }

    setIsLoading(true)

    const valorFloat = converterValorParaFloat(valorEditado)
    if (isNaN(valorFloat) || valorFloat <= 0) {
      setErrors((prev) => ({
        ...prev,
        valor: "Valor deve ser um número positivo",
      }))
      setIsLoading(false)
      return
    }

    let formattedDate = dataTransacao
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(
      dataTransacao
    )
    if (isoRegex) {
      const dateObj = new Date(dataTransacao)
      const day = String(dateObj.getUTCDate()).padStart(2, "0")
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0")
      const year = dateObj.getUTCFullYear()
      formattedDate = `${day}-${month}-${year}`
    }

    const transactionData: Record<string, any> = {
      email: emailFromCookie,
      nome: nome,
      tipo: tipoTransacao,
      fonte: fonteTransacao,
      detalhesFonte: detalhesFonte || "",
      data: formattedDate,
      valor: valorFloat,
      numeroParcelas: parcelamento === "a-vista" ? 1 : parseInt(parcelas, 10),
    }

    if (fonteTransacao === "cartao-credito") {
      transactionData.cardId = selectedCardId
    }

    try {
      const apiUrl =
        fonteTransacao === "cartao-credito" && parcelamento === "a-prazo"
          ? "/api/transactions/create-parcels"
          : "/api/transactions/create-transactions"

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao salvar a transação")
      }

      setIsLoading(false)
      setOpen(false)
      resetForm()
      router.reload()
    } catch (error) {
      console.error("Erro:", error)
      setIsLoading(false)
      setErrors((prev) => ({
        ...prev,
        submit: "Erro ao processar a requisição. Tente novamente.",
      }))
    }
  }

  const resetForm = () => {
    setNome("")
    setTipoTransacao("")
    setFonteTransacao("")
    setDetalhesFonte("")
    setDataTransacao("")
    setValorEditado("")
    setSelectedCardId(undefined)
    setParcelamento("a-vista")
    setParcelas("1")
    setErrors({})
  }

  const handleDialogClose = () => {
    setOpen(false)
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => setOpen(isOpen)}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="ml-12 lg:ml-4 gap-1 border-2"
          onClick={() => setOpen(true)}
        >
          Adicionar
          <ChevronRight className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-h-[90vh] overflow-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Criação de Nova Transação</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <LottieAnimation animationPath="/loadingAnimation.json" />
          </div>
        ) : (
          <div className="p-8">
            <form onSubmit={handleSubmitForm}>
              <div className="grid gap-4 mb-12 sm:grid-cols-2 sm:gap-8">
                {/* Descrição */}
                <div className="grid gap-2">
                  <Label className="text-left" htmlFor="nome">
                    Descrição
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Burger King, Gasolina, etc"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                  {errors.nome && (
                    <span className="text-red-500 text-sm">{errors.nome}</span>
                  )}
                </div>

                {/* Tipo */}
                <div className="grid gap-2">
                  <Label className="text-left" htmlFor="tipoTransacao">
                    Tipo
                  </Label>
                  <Select
                    value={tipoTransacao}
                    onValueChange={(value) =>
                      setTipoTransacao(value as "receita" | "despesa")
                    }
                    required
                  >
                    <SelectTrigger className="w-full text-muted-foreground focus:text-foreground">
                      <SelectValue placeholder="Receita ou Despesa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.tipoTransacao && (
                    <span className="text-red-500 text-sm">
                      {errors.tipoTransacao}
                    </span>
                  )}
                </div>

                {/* Meio de Pagamento */}
                <div className="grid gap-2">
                  <Label className="text-left" htmlFor="fonteTransacao">
                    Meio de Pagamento
                  </Label>
                  <Select
                    value={fonteTransacao}
                    onValueChange={(value) => setFonteTransacao(value)}
                    required
                  >
                    <SelectTrigger className="w-full text-muted-foreground focus:text-foreground">
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoTransacao === "despesa" && (
                        <>
                          <SelectItem value="cartao-credito">
                            Cartão de Crédito
                          </SelectItem>
                          <SelectItem value="cartao-debito">
                            Cartão de Débito
                          </SelectItem>
                        </>
                      )}
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="cedulas">Espécie</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.fonteTransacao && (
                    <span className="text-red-500 text-sm">
                      {errors.fonteTransacao}
                    </span>
                  )}
                </div>

                {/* Origem (se não for cartão) */}
                {!isCardSelectVisible && (
                  <div className="grid gap-2">
                    <Label className="text-left" htmlFor="detalhesFonte">
                      Origem
                    </Label>
                    <Input
                      id="detalhesFonte"
                      placeholder="De qual Conta/Instituição"
                      value={detalhesFonte}
                      onChange={(e) => setDetalhesFonte(e.target.value)}
                    />
                    {errors.detalhesFonte && (
                      <span className="text-red-500 text-sm">
                        {errors.detalhesFonte}
                      </span>
                    )}
                  </div>
                )}

                {/* Seleção de Cartão */}
                {isCardSelectVisible && (
                  <>
                    <div className="grid gap-2">
                      <Label className="text-left" htmlFor="cardId">
                        Selecionar Cartão
                      </Label>
                      <Select
                        value={selectedCardId || ""}
                        onValueChange={(value) => setSelectedCardId(value)}
                        required
                      >
                        <SelectTrigger className="w-full text-muted-foreground focus:text-foreground">
                          <SelectValue placeholder="Selecione um cartão" />
                        </SelectTrigger>
                        <SelectContent>
                          {cards
                            .filter(
                              (card) =>
                                card.tipoCartao === fonteTransacao.split("-")[1]
                            )
                            .map((card) => (
                              <SelectItem key={card.cardId} value={card.cardId}>
                                {card.nomeCartao} ({card.bandeira})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {errors.cardId && (
                        <span className="text-red-500 text-sm">
                          {errors.cardId}
                        </span>
                      )}
                    </div>

                    {/* Parcelamento */}
                    <div className="grid gap-2">
                      <Label className="text-left" htmlFor="parcelamento">
                        Parcelamento
                      </Label>
                      <Select
                        value={parcelamento}
                        onValueChange={(value) =>
                          setParcelamento(value as "a-vista" | "a-prazo")
                        }
                        required
                      >
                        <SelectTrigger className="w-full text-muted-foreground focus:text-foreground">
                          <SelectValue placeholder="Selecione o parcelamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="a-vista">À Vista</SelectItem>
                          <SelectItem value="a-prazo">À Prazo</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.parcelamento && (
                        <span className="text-red-500 text-sm">
                          {errors.parcelamento}
                        </span>
                      )}
                    </div>

                    {/* Número de Parcelas (se for à prazo) */}
                    {parcelamento === "a-prazo" && (
                      <div className="grid gap-2">
                        <Label className="text-left" htmlFor="parcelas">
                          Número de Parcelas
                        </Label>
                        <Input
                          id="parcelas"
                          type="number"
                          placeholder="1x"
                          value={parcelas}
                          onChange={(e) => {
                            const value = e.target.value
                            const num = parseInt(value, 10)
                            if (!isNaN(num)) {
                              setParcelas(
                                String(Math.min(12, Math.max(1, num)))
                              )
                            } else {
                              setParcelas(e.target.value)
                            }
                          }}
                          required
                          min={1}
                          max={12}
                        />
                        {errors.parcelas && (
                          <span className="text-red-500 text-sm">
                            {errors.parcelas}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Data */}
                <div className="grid gap-2">
                  <Label className="text-left" htmlFor="dataTransacao">
                    Data
                  </Label>
                  <Popover modal={false}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal ${
                          !dataTransacao && "text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataTransacao ? (
                          format(
                            parse(dataTransacao, "dd-MM-yyyy", new Date()),
                            "dd/MM/yyyy"
                          )
                        ) : (
                          <span>Selecione uma Data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      style={{ zIndex: 9999, pointerEvents: "auto" }}
                    >
                      <div style={{ pointerEvents: "auto" }}>
                        <Calendar
                          locale={ptBR}
                          mode="single"
                          selected={
                            dataTransacao
                              ? parse(dataTransacao, "dd-MM-yyyy", new Date())
                              : undefined
                          }
                          onSelect={(selectedDate) => {
                            if (selectedDate) {
                              const dia = String(
                                selectedDate.getDate()
                              ).padStart(2, "0")
                              const mes = String(
                                selectedDate.getMonth() + 1
                              ).padStart(2, "0")
                              const ano = selectedDate.getFullYear()
                              setDataTransacao(`${dia}-${mes}-${ano}`)
                            } else {
                              setDataTransacao("")
                            }
                          }}
                          initialFocus
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  {errors.dataTransacao && (
                    <span className="text-red-500 text-sm">
                      {errors.dataTransacao}
                    </span>
                  )}
                </div>

                {/* Valor */}
                <div className="grid gap-2">
                  <Label className="text-left" htmlFor="valor">
                    {parcelamento === "a-prazo" ? "Valor Total" : "Valor"}
                  </Label>
                  <Input
                    id="valor"
                    placeholder={
                      parcelamento === "a-prazo"
                        ? "Exemplo: 499,90"
                        : "Exemplo: 199,90"
                    }
                    value={valorEditado}
                    onChange={(e) => {
                      const novoValor = e.target.value
                      const valorValidado = novoValor.replace(/[^0-9.,]/g, "")
                      const valorFormatado =
                        "R$ " + formatadorValor(valorValidado)
                      setValorEditado(valorFormatado)
                    }}
                    required
                  />
                  {errors.valor && (
                    <span className="text-red-500 text-sm">{errors.valor}</span>
                  )}
                </div>
              </div>

              {/* Mensagem de Erro de Submissão */}
              {errors.submit && (
                <div className="mb-4">
                  <span className="text-red-500 text-sm">{errors.submit}</span>
                </div>
              )}

              <DialogFooter className="lg:flex lg:justify-end lg:items-end flex-col gap-4">
                <DialogClose asChild>
                  <Button variant="outline" onClick={handleDialogClose}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit">Criar Transação</Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CreateTransaction
