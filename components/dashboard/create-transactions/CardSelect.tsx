import React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Card {
  cardId: string;
  nomeCartao: string;
  bandeira: string;
  tipoCartao: "credito" | "debito";
}

interface CardSelectProps {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string
  cards: Card[] | null 
}

export const CardSelect: React.FC<CardSelectProps> = ({
  value,
  onChange,
  onBlur,
  error,
  cards,
}) => {
  const hasCards = Array.isArray(cards) && cards.length > 0

  return (
    <div className="grid gap-2">
      {hasCards ? (
        <Select
        value={value}
        onValueChange={onChange}
        onOpenChange={onBlur}
        >
        <Label htmlFor="card-select">Selecione o Cartão</Label>
          <SelectTrigger id="card-select">
            <SelectValue placeholder="Selecione um cartão" />
          </SelectTrigger>
          <SelectContent>
            {cards.map((card) => (
              <SelectItem key={card.cardId} value={card.cardId}>
                {card.nomeCartao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-gray-500 mb-2">
            Você ainda não possui cartões cadastrados.
          </p>
          <Link href="/dashboard/cards" passHref>
            <Button variant="outline" className="w-full mb-4">
              Cadastrar Novo Cartão
            </Button>
          </Link>
        </div>
      )}
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  )
}
