import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Calendar as CalendarIcon } from "lucide-react"
import { parseCookies } from "nookies"
import CardsView from "./CardsView"

const CreateCreditCard = () => {
  const [nome, setNome] = useState<string>("")
  const [bandeira, setBandeira] = useState<string>("")
  const [instituicao, setInstituicao] = useState<string>("")
  const [vencimento, setVencimento] = useState<number | undefined>()
  const [limite, setLimite] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [cardCreated, setCardCreated] = useState<boolean>(false)

  const handleSubmit = async () => {
    const cookies = parseCookies()
    const userId = cookies.userId

    if (!userId) {
      alert("Erro: Usuário não autenticado.")
      return
    }

    const cardData = {
      userId: Number(userId),
      tipo: "credito",
      nome,
      bandeira,
      instituicao,
      vencimento,
      limite,
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/Cards/saveCards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardData),
      })

      const result = await response.json()
      if (response.ok) {
        setCardCreated(true)
      } else {
        alert(`Erro: ${result.message || "Não foi possível criar o cartão."}`)
      }
    } catch (error) {
      console.error("Erro ao criar o cartão:", error)
      alert("Erro ao criar o cartão. Tente novamente mais tarde.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (cardCreated) {
    return <CardsView />
  }

  return (
    <div className="flex justify-center items-center min-h-[90vh]">
      <Card className="w-[400px]">
        <CardTitle className="px-6 pt-6">Registrar Cartão de Crédito</CardTitle>
        <CardDescription className="px-6 pt-4">
          Preencha o formulário abaixo para registrar seu cartão de crédito
        </CardDescription>
        <Separator className="w-full my-6" />
        <CardContent className="flex-col gap-4">
          <div className="mb-4">
            <Label htmlFor="card-name">Nome do Cartão</Label>
            <Input
              id="card-name"
              placeholder="Ex: Cartão Inter"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="card-bandeira">Bandeira</Label>
            <Select onValueChange={(value) => setBandeira(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a bandeira do cartão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mastercard">Mastercard</SelectItem>
                <SelectItem value="Visa">Visa</SelectItem>
                <SelectItem value="Elo">Elo</SelectItem>
                <SelectItem value="American Express">
                  American Express
                </SelectItem>
                <SelectItem value="Hipercard">Hipercard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <Label htmlFor="card-instituicao">Instituição</Label>
            <Input
              id="card-instituicao"
              placeholder="Ex: Banco Inter"
              value={instituicao}
              onChange={(e) => setInstituicao(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="card-limite">Limite do Cartão</Label>
            <Input
              id="card-limite"
              placeholder="Ex: R$ 5.000,00"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="card-vencimento">Vencimento da Fatura (Dia)</Label>
            <div className="relative">
              <Input
                id="card-vencimento"
                type="number"
                placeholder="Ex: 15"
                value={vencimento || ""}
                onChange={(e) =>
                  setVencimento(
                    Math.max(1, Math.min(31, Number(e.target.value)))
                  )
                }
                className="pl-10"
                min={1}
                max={31}
              />
              <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Criando..." : "Criar Cartão de Crédito"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateCreditCard
