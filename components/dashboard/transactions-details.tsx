import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ptBR } from "date-fns/locale"

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { DialogClose } from "@radix-ui/react-dialog"
import { Calendar as CalendarIcon } from "lucide-react"

import formatadorValor from "@/utils/valueFormatter"
import { monthNames } from "@/utils/monthNames"

interface TransactionsDetailsProps {
  transactionId: string
}

const TransactionsDetails = ({ transactionId }: TransactionsDetailsProps) => {
  const [date, setDate] = React.useState<Date>()
  const [valorEditado, setValor] = useState("")
  const [erro] = useState(false)
  const [id, setTransactionId] = useState("")
  const [nome, setNome] = useState("")
  const [tipoTransacao, setTipoTransacao] = useState("")
  const [fonteTransacao, setFonteTransacao] = useState("")
  const [detalhesFonte, setDetalhesFonte] = useState("")
  const [valorTransacao, setValorTransacao] = useState("")
  const [dataTransacao, setDataTransacao] = useState<Date | undefined>()
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const novoValor = "R$ " + formatadorValor(event.target.value)
    setValor(novoValor)
  }

  const handleTipoTransacaoChange = (value: string) => {
    setTipoTransacao(value)
    setFonteTransacao("")
  }

  const handleTransactionsDetails = async () => {
    console.log("Transaction ID received:", transactionId)

    try {
      const response = await fetch("/api/Transactions/viewTransactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionId }),
      })

      if (!response.ok) {
        throw new Error("Falha ao enviar requisição para a API.")
      }

      const data = await response.json()

      if (data) {
        setNome(data.nome || "")
        setTipoTransacao(data.tipo || "")
        setFonteTransacao(data.fonte || "")
        setDetalhesFonte(data.detalhesFonte || "")

        const dateParts = data.data.split("-")
        const monthNumber = parseInt(dateParts[1], 10)
        const monthName = monthNames[monthNumber - 1]

        const formattedDate = new Date(
          `${monthName} ${dateParts[0]} ${dateParts[2]}`
        )

        setDataTransacao(formattedDate)
        setDate(formattedDate)

        const valorFormatado = "R$ " + formatadorValor(data.valor)
        setValorTransacao(data.valor || "")
        setValor(valorFormatado || "")
      }
    } catch (error) {
      console.error("Erro na requisição:", error)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      const response = await fetch("/api/Transactions/editTransactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId,
          nome,
          tipo: tipoTransacao,
          fonte: fonteTransacao,
          detalhesFonte,
          valor: valorTransacao,
          data: dataTransacao,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao enviar requisição para a API.")
      }

      setSubmitSuccess(true)
    } catch (error) {
      console.error("Erro na requisição:", error)
    }
  }

  useEffect(() => {
    if (submitSuccess) {
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 3000)
    }
  }, [submitSuccess])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={handleTransactionsDetails}
          variant="outline"
          size="sm"
          className="ml-auto lg:ml-4 gap-1"
        >
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes da Transação</DialogTitle>
          <DialogDescription>
            Aqui você poderá verificar todos os detalhes referentes à esta
            transação.
          </DialogDescription>
          <div className="pt-8 pb-4">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 mb-12">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-left" htmlFor="nome">
                      Nome da Transação
                    </Label>
                    <Input
                      id="nome"
                      placeholder="Tênis Nike, Burger King, etc"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-left" htmlFor="type-transaction">
                      Tipo de Transação
                    </Label>
                    <Select
                      value={tipoTransacao}
                      onValueChange={(value) =>
                        handleTipoTransacaoChange(value)
                      }
                      required
                    >
                      <SelectTrigger className="w-[180px] text-muted-foreground focus:text-foreground">
                        <SelectValue placeholder="Receita ou Despesa"></SelectValue>
                      </SelectTrigger>
                      <SelectContent id="select-type">
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 mb-12">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-left" htmlFor="select-fonte">
                      Fonte da Transação
                    </Label>
                    <Select
                      value={fonteTransacao}
                      onValueChange={(value) => setFonteTransacao(value)}
                      required
                    >
                      <SelectTrigger className="w-[180px] text-muted-foreground focus:text-foreground">
                        <SelectValue placeholder="Onde saiu ou entrou?"></SelectValue>
                      </SelectTrigger>
                      <SelectContent id="select-fonte">
                        <SelectItem value="cartao-credito">
                          Cartão de Crédito
                        </SelectItem>
                        <SelectItem value="cartao-debito">
                          Cartão de Débito
                        </SelectItem>
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
                      Detalhes da Fonte
                    </Label>
                    <Input
                      id="detalhes-fonte"
                      placeholder="De qual Conta/Instituição"
                      value={detalhesFonte}
                      required
                      onChange={(e) => setDetalhesFonte(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 mb-12">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-left" htmlFor="data">
                      Data da Transação
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[180px] justify-start text-left font-normal",
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
                      Valor da Transação
                    </Label>
                    <Input
                      id="valor"
                      placeholder="Exemplo: 199,90"
                      value={valorEditado} // Usa o estado valorEditado que agora contém o valor formatado
                      onChange={(e) => {
                        handleChange(e)
                        setValorTransacao(e.target.value) // Mantém o valor original para processamento
                      }}
                      required
                    />
                  </div>
                </div>
              </div>
              {erro && (
                <div className="text-red-500">
                  Por favor, preencha todos os campos!
                </div>
              )}
              <DialogFooter className="lg:flex lg:justify-end lg:items-end">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Salvar Transação</Button>
              </DialogFooter>
            </form>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default TransactionsDetails
