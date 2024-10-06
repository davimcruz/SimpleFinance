import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
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
import LottieAnimation from "../dashboard/table/loadingAnimation"

interface CardType {
  cardId: string
  nomeCartao: string
  bandeira: string
  tipoCartao: "credito" | "debito"
}

const CreateTransaction = () => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date>()
  const [valorEditado, setValor] = useState<string>("")
  const [nome, setNome] = useState<string>("")
  const [tipoTransacao, setTipoTransacao] = useState<string>("")
  const [fonteTransacao, setFonteTransacao] = useState<string>("")
  const [detalhesFonte, setDetalhesFonte] = useState<string>("")
  const [dataTransacao, setDataTransacao] = useState<Date | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [cards, setCards] = useState<CardType[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isCardSelectVisible, setIsCardSelectVisible] = useState(false)
  const [parcelas, setParcelas] = useState<number>(1)
  const [parcelamento, setParcelamento] = useState<string>("a-vista")

  const cookies = parseCookies()
  const userId = cookies.userId

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch(`/api/Queries/queryCards?userId=${userId}`)
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

  const handleDialogClose = () => {
    setOpen(false)
    setTipoTransacao("")
    setFonteTransacao("")
    setSelectedCardId(null)
    setIsCardSelectVisible(false)
    setParcelas(1)
    setParcelamento("a-vista")
  }

  const handleValorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const novoValor = event.target.value
    const valorValidado = novoValor.replace(/[^0-9.,]/g, "")
    const valorFormatado = "R$ " + formatadorValor(valorValidado)
    setValor(valorFormatado)
  }

  const handleTipoTransacaoChange = (value: string) => {
    setTipoTransacao(value)
    setFonteTransacao("")
    setIsCardSelectVisible(false)
    setParcelas(1)
  }

  const handleFonteTransacaoChange = (value: string) => {
    setFonteTransacao(value)
    if (value === "cartao-credito") {
      setIsCardSelectVisible(true)
    } else {
      setIsCardSelectVisible(false)
      setParcelamento("a-vista")
    }
  }

  const converterValorParaFloat = (valor: string): number => {
    const valorValidado = valor.replace(/[^0-9,]/g, "")
    if (!valorValidado) return NaN
    const valorSemPontos = valorValidado.replace(/\./g, "")
    const valorComPonto = valorSemPontos.replace(",", ".")
    return parseFloat(valorComPonto)
  }

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault()
    setIsLoading(true)

    let emailFromCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("email="))
      ?.split("=")[1]

    if (!emailFromCookie) {
      console.error("Email não encontrado nos cookies")
      setIsLoading(false)
      return
    }

    emailFromCookie = decodeURIComponent(emailFromCookie)

    const valorFloat = converterValorParaFloat(valorEditado)
    if (isNaN(valorFloat) || valorFloat <= 0) {
      console.error("Valor inválido")
      setIsLoading(false)
      return
    }

    const transactionData = {
      email: emailFromCookie,
      nome,
      tipo: tipoTransacao,
      fonte: fonteTransacao,
      detalhesFonte,
      data: dataTransacao,
      valor: valorFloat,
      cardId: selectedCardId,
      numeroParcelas: parcelamento === "a-vista" ? 1 : parcelas,
    }

    try {
      const apiUrl =
        fonteTransacao === "cartao-credito" && parcelamento === "a-prazo"
          ? "/api/Cards/CreditCard/createParcelTransaction"
          : "/api/Transactions/saveTransactions"

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar a transação")
      }

      setIsLoading(false)
      setOpen(false)
      router.reload()
    } catch (error) {
      console.error("Erro:", error)
      setIsLoading(false)
    }
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center">
              <LottieAnimation animationPath="/loadingAnimation.json" />
            </div>
          ) : (
            <div className="pt-8 pb-4">
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 mb-12 sm:grid-cols-2 sm:gap-8">
                  <div className="grid gap-2">
                    <Label className="text-left" htmlFor="nome">
                      Descrição
                    </Label>
                    <Input
                      id="nome"
                      placeholder="Burger King, Gasolina, etc"
                      required
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-left" htmlFor="type-transaction">
                      Tipo
                    </Label>
                    <Select onValueChange={handleTipoTransacaoChange} required>
                      <SelectTrigger className="w-full text-muted-foreground focus:text-foreground">
                        <SelectValue placeholder="Receita ou Despesa"></SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-left" htmlFor="select-fonte">
                      Meio de Pagamento
                    </Label>
                    <Select onValueChange={handleFonteTransacaoChange} required>
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
                  </div>

                  {!isCardSelectVisible && (
                    <div className="grid gap-2">
                      <Label className="text-left" htmlFor="detalhes-fonte">
                        Origem
                      </Label>
                      <Input
                        id="detalhes-fonte"
                        placeholder="De qual Conta/Instituição"
                        required
                        onChange={(e) => setDetalhesFonte(e.target.value)}
                      />
                    </div>
                  )}

                  {isCardSelectVisible && (
                    <>
                      <div className="grid gap-2">
                        <Label className="text-left">Selecionar Cartão</Label>
                        <Select onValueChange={setSelectedCardId}>
                          <SelectTrigger className="w-full text-muted-foreground focus:text-foreground">
                            <SelectValue placeholder="Selecione um cartão" />
                          </SelectTrigger>
                          <SelectContent>
                            {cards
                              .filter(
                                (card) =>
                                  card.tipoCartao ===
                                  fonteTransacao.split("-")[1]
                              )
                              .map((card) => (
                                <SelectItem
                                  key={card.cardId}
                                  value={card.cardId}
                                >
                                  {card.nomeCartao} ({card.bandeira})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-left" htmlFor="parcelamento">
                          Parcelamento
                        </Label>
                        <Select
                          onValueChange={(value) => {
                            setParcelamento(value)
                            if (value === "a-vista") {
                              setParcelas(1)
                            }
                          }}
                          value={parcelamento}
                          required
                        >
                          <SelectTrigger className="w-full text-muted-foreground focus:text-foreground">
                            <SelectValue placeholder="Selecione o parcelamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a-vista">A Vista</SelectItem>
                            <SelectItem value="a-prazo">A Prazo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

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
                            onChange={(e) =>
                              setParcelas(
                                Math.min(
                                  12,
                                  Math.max(1, parseInt(e.target.value, 10))
                                )
                              )
                            }
                            required
                            min={1}
                            max={12}
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div className="grid gap-2">
                    <Label className="text-left" htmlFor="data">
                      Data
                    </Label>

                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? (
                            format(date, "dd/MM/yyyy")
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
                            selected={date}
                            onSelect={(selectedDate) => {
                              setDate(selectedDate)
                              setDataTransacao(selectedDate)
                            }}
                            initialFocus
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

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
                      onChange={handleValorChange}
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="lg:flex lg:justify-end lg:items-end flex-col gap-4">
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit">Criar Transação</Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTransaction
