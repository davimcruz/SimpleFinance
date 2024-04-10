import React, { useState } from "react"
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
import { Plus } from "lucide-react"
import { Calendar as CalendarIcon } from "lucide-react"

import formatadorValor from "@/utils/valueFormatter"
import { DialogClose } from "@radix-ui/react-dialog"

const CreateTransaction = () => {
  const [date, setDate] = React.useState<Date>()
  const [valorEditado, setValor] = useState("")
  const [erro] = useState(false)
  const [nome, setNome] = useState("")
  const [tipoTransacao, setTipoTransacao] = useState("")
  const [fonteTransacao, setFonteTransacao] = useState("")
  const [detalhesFonte, setDetalhesFonte] = useState("")
  const [valorTransacao, setValorTransacao] = useState("")
  const [dataTransacao, setDataTransacao] = useState<Date | undefined>()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const novoValor = "R$ " + formatadorValor(event.target.value)
    setValor(novoValor)
  }

  const handleTipoTransacaoChange = (value: string) => {
    setTipoTransacao(value)
    setFonteTransacao("")
  }

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    let emailFromCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("email="))
      ?.split("=")[1]

    if (!emailFromCookie) {
      console.error("Email não encontrado nos cookies")
      return
    }

    emailFromCookie = decodeURIComponent(emailFromCookie)

    const transactionData = {
      email: emailFromCookie,
      nome,
      tipo: tipoTransacao,
      fonte: fonteTransacao,
      detalhesFonte,
      data: dataTransacao,
      valor: valorTransacao,
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
    } catch (error) {
      console.error("Erro:", error)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="ml-auto lg:ml-4 gap-1">
          Adicionar
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criação de Nova Transação</DialogTitle>
          <DialogDescription>
            Aqui você poderá criar uma nova transação baseada em suas
            movimentações financeiras.
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
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-left" htmlFor="type-transaction">
                      Tipo de Transação
                    </Label>
                    <Select
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
                      onValueChange={(value) => setFonteTransacao(value)}
                      required
                    >
                      <SelectTrigger className="w-[180px] text-muted-foreground focus:text-foreground">
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
                      Detalhes da Fonte
                    </Label>
                    <Input
                      id="detalhes-fonte"
                      placeholder="De qual Conta/Instituição"
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
                      value={valorEditado}
                      onChange={(e) => {
                        handleChange(e)
                        setValorTransacao(e.target.value)
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
                <Button type="submit">Criar Transação</Button>
              </DialogFooter>
            </form>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTransaction
