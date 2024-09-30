import React, { useState } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/router"

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
import { ChevronRight } from "lucide-react"
import { Calendar as CalendarIcon } from "lucide-react"

import formatadorValor from "@/utils/valueFormatter"
import LottieAnimation from "../dashboard/table/loadingAnimation"

const CreateTransaction = () => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [date, setDate] = React.useState<Date>()
  const [valorEditado, setValor] = useState<string>("")
  const [nome, setNome] = useState<string>("")
  const [tipoTransacao, setTipoTransacao] = useState<string>("")
  const [fonteTransacao, setFonteTransacao] = useState<string>("")
  const [detalhesFonte, setDetalhesFonte] = useState<string>("")
  const [dataTransacao, setDataTransacao] = useState<Date | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const handleValorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const novoValor = event.target.value

    const valorValidado = novoValor.replace(/[^0-9.,]/g, "")

    const valorFormatado = "R$ " + formatadorValor(valorValidado)
    setValor(valorFormatado)
  }

  const handleTipoTransacaoChange = (value: string) => {
    setTipoTransacao(value)
    setFonteTransacao("")
  }

  const converterValorParaFloat = (valor: string): number => {
    const valorValidado = valor.replace(/[^0-9,]/g, "")

    if (!valorValidado) {
      return NaN
    }

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
    }

    try {
      const response = await fetch("/api/Transactions/saveTransactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    <Dialog open={open} onOpenChange={setOpen}>
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
              <p className="text-lg font-bold">Salvando transação...</p>
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
                      placeholder="Tênis Nike, Burger King, etc"
                      required
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-left" htmlFor="type-transaction">
                      Tipo
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleTipoTransacaoChange(value)
                      }
                      required
                    >
                      <SelectTrigger className="w-full text-muted-foreground focus:text-foreground">
                        <SelectValue placeholder="Receita ou Despesa"></SelectValue>
                      </SelectTrigger>
                      <SelectContent id="select-type">
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-left" htmlFor="select-fonte">
                      Meio de Pagamento
                    </Label>
                    <Select
                      onValueChange={(value) => setFonteTransacao(value)}
                      required
                    >
                      <SelectTrigger className="w-full text-muted-foreground focus:text-foreground">
                        <SelectValue placeholder="Onde saiu ou entrou?"></SelectValue>
                      </SelectTrigger>
                      <SelectContent id="select-fonte">
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
                        <SelectItem value="investimentos">
                          Investimentos
                        </SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="ted-doc">TED/DOC</SelectItem>
                        <SelectItem value="cedulas">Cédulas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  <div className="grid gap-2">
                    <Label className="text-left" htmlFor="data">
                      Data
                    </Label>
                    <Popover>
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
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          locale={ptBR}
                          mode="single"
                          selected={date}
                          onSelect={(selectedDate) => {
                            setDate(selectedDate)
                            setDataTransacao(selectedDate)
                          }}
                          initialFocus
                          required
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-left" htmlFor="valor">
                      Valor
                    </Label>
                    <Input
                      id="valor"
                      placeholder="Exemplo: 199,90"
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
