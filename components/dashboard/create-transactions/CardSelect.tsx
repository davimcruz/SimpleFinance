import React, { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { parseCookies } from "nookies"

interface Card {
  cardId: string
  nomeCartao: string
  bandeira: string
  instituicao: string
  tipoCartao: "credito" | "debito"
  vencimento: number
  limite: number
}

interface CardSelectProps {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string
}

export const CardSelect: React.FC<CardSelectProps> = ({
  value,
  onChange,
  onBlur,
  error,
}) => {
  const [cards, setCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCards = async () => {
      setIsLoading(true)
      setFetchError(null)
      try {
        const cookies = parseCookies()
        const userId = cookies.userId

        const response = await fetch(`/api/cards/get-card?userId=${userId}`)
        if (!response.ok) {
          throw new Error("Falha ao buscar cartões")
        }
        const data = await response.json()
        setCards(
          data.cartoes.filter((card: Card) => card.tipoCartao === "credito")
        )
      } catch (error) {
        console.error("Erro ao buscar cartões:", error)
        setFetchError("Erro ao carregar cartões. Por favor, tente novamente.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCards()
  }, [])

  if (isLoading) {
    return <div>Carregando cartões...</div>
  }

  if (fetchError) {
    return <div className="text-red-500">{fetchError}</div>
  }

  if (cards.length === 0) {
    return <div>Nenhum cartão de crédito encontrado.</div>
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="cardId">Selecione o Cartão de Crédito</Label>
      <Select value={value} onValueChange={onChange} onOpenChange={onBlur}>
        <SelectTrigger id="cardId">
          <SelectValue placeholder="Escolha um cartão de crédito" />
        </SelectTrigger>
        <SelectContent>
          {cards.map((card) => (
            <SelectItem key={card.cardId} value={card.cardId}>
              {card.nomeCartao} - {card.bandeira} ({card.instituicao})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  )
}
