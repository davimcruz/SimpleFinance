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
import { useCurrencyInput, parseCurrencyToFloat } from "@/utils/moneyFormatter"

const CreateCreditCard = () => {
  const [nome, setNome] = useState<string>("")
  const [bandeira, setBandeira] = useState<string>("")
  const [instituicao, setInstituicao] = useState<string>("")
  const [vencimento, setVencimento] = useState<string>("")
  const [limite, setLimite] = useState<string>("R$ 0,00")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [cardCreated, setCardCreated] = useState<boolean>(false)

  const [errors, setErrors] = useState({
    nome: "",
    bandeira: "",
    instituicao: "",
    vencimento: "",
    limite: "",
  })

  const { handleChange, handleFocus, handleBlur, initialValue } = useCurrencyInput()

  const validateForm = (): boolean => {
    let isValid = true
    const newErrors = {
      nome: "",
      bandeira: "",
      instituicao: "",
      vencimento: "",
      limite: "",
    }

    if (!nome.trim()) {
      newErrors.nome = "Por favor, informe o nome do cartão."
      isValid = false
    }

    if (!bandeira) {
      newErrors.bandeira = "Por favor, selecione a bandeira do cartão."
      isValid = false
    }

    if (!instituicao.trim()) {
      newErrors.instituicao = "Por favor, informe a instituição financeira."
      isValid = false
    }

    if (!vencimento || parseInt(vencimento) < 1 || parseInt(vencimento) > 31) {
      newErrors.vencimento = "Por favor, informe um dia de vencimento válido."
      isValid = false
    }

    if (parseCurrencyToFloat(limite) <= 0) {
      newErrors.limite = "Por favor, informe um limite válido para o cartão."
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

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
      vencimento: parseInt(vencimento),
      limite: parseCurrencyToFloat(limite),
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/cards/create-card", {
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

  const handleVencimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
      setVencimento(value)
      setErrors(prev => ({ ...prev, vencimento: "" }))
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
              onChange={(e) => {
                setNome(e.target.value)
                setErrors(prev => ({ ...prev, nome: "" }))
              }}
              className="w-full"
            />
            {errors.nome && <span className="text-red-500 text-sm">{errors.nome}</span>}
          </div>

          <div className="mb-4">
            <Label htmlFor="card-bandeira">Bandeira</Label>
            <Select 
              onValueChange={(value) => {
                setBandeira(value)
                setErrors(prev => ({ ...prev, bandeira: "" }))
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a bandeira do cartão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mastercard">Mastercard</SelectItem>
                <SelectItem value="Visa">Visa</SelectItem>
                <SelectItem value="Elo">Elo</SelectItem>
                <SelectItem value="American Express">American Express</SelectItem>
                <SelectItem value="Hipercard">Hipercard</SelectItem>
              </SelectContent>
            </Select>
            {errors.bandeira && <span className="text-red-500 text-sm">{errors.bandeira}</span>}
          </div>

          <div className="mb-4">
            <Label htmlFor="card-instituicao">Instituição</Label>
            <Input
              id="card-instituicao"
              placeholder="Ex: Banco Inter"
              value={instituicao}
              onChange={(e) => {
                setInstituicao(e.target.value)
                setErrors(prev => ({ ...prev, instituicao: "" }))
              }}
              className="w-full"
            />
            {errors.instituicao && <span className="text-red-500 text-sm">{errors.instituicao}</span>}
          </div>

          <div className="mb-4">
            <Label htmlFor="card-limite">Limite do Cartão</Label>
            <Input
              id="card-limite"
              placeholder="Ex: R$ 5.000,00"
              value={limite}
              onChange={(e) => {
                setLimite(handleChange(e))
                setErrors(prev => ({ ...prev, limite: "" }))
              }}
              onFocus={(e) => setLimite(handleFocus(limite))}
              onBlur={() => setLimite(handleBlur(limite))}
              className="w-full"
            />
            {errors.limite && <span className="text-red-500 text-sm">{errors.limite}</span>}
          </div>

          <div className="mb-4">
            <Label htmlFor="card-vencimento">Vencimento da Fatura (Dia)</Label>
            <div className="relative">
              <Input
                id="card-vencimento"
                type="number"
                placeholder="Ex: 15"
                value={vencimento}
                onChange={handleVencimentoChange}
                className="pl-10"
                min={1}
                max={31}
              />
              <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
            {errors.vencimento && <span className="text-red-500 text-sm">{errors.vencimento}</span>}
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