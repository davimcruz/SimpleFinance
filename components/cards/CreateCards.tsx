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
import { useCurrencyInput, parseCurrencyToFloat } from "@/utils/moneyFormatter"
import { useNameInput } from "@/utils/nameFormatter"
import { createCardSchema, CreateCardInput } from "@/lib/validation"
import { z } from "zod"
import { useRouter } from "next/router"
import LottieAnimation from "@/components/ui/loadingAnimation"

interface CreateCreditCardProps {
  onCancel: () => void
}

type ErrorType = Partial<Record<keyof CreateCardInput, string>> & { general?: string }

const CreateCreditCard: React.FC<CreateCreditCardProps> = ({ onCancel }) => {
  const [nome, setNome] = useState<string>("")
  const [bandeira, setBandeira] = useState<string>("")
  const [instituicao, setInstituicao] = useState<string>("")
  const [vencimento, setVencimento] = useState<string>("")
  const [limite, setLimite] = useState<string>("R$ 0,00")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errors, setErrors] = useState<ErrorType>({})

  const router = useRouter()

  const { handleChange, handleFocus, handleBlur } = useCurrencyInput()
  const { handleNameChange } = useNameInput()

  const validateForm = (): boolean => {
    try {
      const parsedData: CreateCardInput = createCardSchema.parse({
        userId: Number(parseCookies().userId),
        nome,
        bandeira,
        instituicao,
        tipo: "credito",
        vencimento: parseInt(vencimento),
        limite: parseCurrencyToFloat(limite),
      })
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof CreateCardInput, string>> = {}
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0] as keyof CreateCardInput] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
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

    const cardData: CreateCardInput = {
      userId: Number(userId),
      tipo: "credito",
      nome,
      bandeira: bandeira as CreateCardInput["bandeira"],
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
        setTimeout(() => {
          router.reload()
        }, 500) 
      } else {
        setErrors({ general: result.message || "Não foi possível criar o cartão." })
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Erro ao criar o cartão:", error)
      setErrors({ general: "Erro ao criar o cartão. Tente novamente mais tarde." })
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

  return (
    <div className="flex justify-center items-center min-h-[100vh] md:min-h-[90vh]">
      <Card
        className="sm:w-[400px] max-w-[100vw]
      md:h-auto md:max-h-[85vh]
      md:rounded-lg rounded-none
      flex flex-col
      pt-6 md:pt-0
      "
      >
        {isSubmitting ? (
          <>
            <CardTitle>Criando cartão...</CardTitle>
            <CardContent className="flex justify-center items-center h-[400px]">
              <LottieAnimation animationPath="/loadingAnimation.json" />
            </CardContent>
          </>
        ) : (
          <>
            <CardTitle className="px-6 pt-6">
              Registrar Cartão de Crédito
            </CardTitle>
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
                  onChange={(e) => handleNameChange(e, { onChange: setNome })}
                  className="w-full"
                />
                {errors.nome && (
                  <span className="text-red-500 text-sm">{errors.nome}</span>
                )}
              </div>

              <div className="mb-4">
                <Label htmlFor="card-bandeira">Bandeira</Label>
                <Select
                  onValueChange={(value) => {
                    setBandeira(value)
                    setErrors((prev) => ({ ...prev, bandeira: "" }))
                  }}
                >
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
                {errors.bandeira && (
                  <span className="text-red-500 text-sm">
                    {errors.bandeira}
                  </span>
                )}
              </div>

              <div className="mb-4">
                <Label htmlFor="card-instituicao">Instituição</Label>
                <Input
                  id="card-instituicao"
                  placeholder="Ex: Banco Inter"
                  value={instituicao}
                  onChange={(e) =>
                    handleNameChange(e, { onChange: setInstituicao })
                  }
                  className="w-full"
                />
                {errors.instituicao && (
                  <span className="text-red-500 text-sm">
                    {errors.instituicao}
                  </span>
                )}
              </div>

              <div className="mb-4">
                <Label htmlFor="card-limite">Limite do Cartão</Label>
                <Input
                  id="card-limite"
                  placeholder="Ex: R$ 5.000,00"
                  value={limite}
                  onChange={(e) => {
                    setLimite(handleChange(e))
                    setErrors((prev) => ({ ...prev, limite: "" }))
                  }}
                  onFocus={(e) => setLimite(handleFocus(limite))}
                  onBlur={() => setLimite(handleBlur(limite))}
                  className="w-full"
                />
                {errors.limite && (
                  <span className="text-red-500 text-sm">{errors.limite}</span>
                )}
              </div>

              <div className="mb-4">
                <Label htmlFor="card-vencimento">
                  Vencimento da Fatura (Dia)
                </Label>
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
                {errors.vencimento && (
                  <span className="text-red-500 text-sm">
                    {errors.vencimento}
                  </span>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full mt-6"
                disabled={isSubmitting}
              >
                Criar Cartão de Crédito
              </Button>
              <Button
                onClick={onCancel}
                className="w-full mt-2"
                variant="outline"
              >
                Cancelar
              </Button>
              {errors.general && (
                <span className="text-red-500 text-sm mt-2">
                  {errors.general}
                </span>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}

export default CreateCreditCard
