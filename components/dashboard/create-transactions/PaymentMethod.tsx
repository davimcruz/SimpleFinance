import React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface PaymentMethodSelectProps {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string
  transactionType: "receita" | "despesa"
}

export const PaymentMethodSelect: React.FC<PaymentMethodSelectProps> = ({
  value,
  onChange,
  onBlur,
  error,
  transactionType,
}) => {
  const paymentMethods = {
    receita: [
      { value: "pix", label: "PIX" },
      { value: "boleto", label: "Boleto" },
      { value: "especie", label: "Espécie" },
      { value: "outros", label: "Outros" },
    ],
    despesa: [
      { value: "cartao-credito", label: "Cartão de Crédito" },
      { value: "cartao-debito", label: "Cartão de Débito" },
      { value: "pix", label: "PIX" },
      { value: "boleto", label: "Boleto" },
      { value: "especie", label: "Espécie" },
      { value: "outros", label: "Outros" },
    ],
  }

  const methods = transactionType ? paymentMethods[transactionType] : []

  return (
    <div className="grid gap-2">
      <Label htmlFor="fonteTransacao">Meio de Pagamento</Label>
      <Select value={value} onValueChange={onChange} onOpenChange={onBlur}>
        <SelectTrigger id="fonteTransacao">
          <SelectValue placeholder="Selecione o meio de pagamento" />
        </SelectTrigger>
        <SelectContent>
          {methods.map((method) => (
            <SelectItem key={method.value} value={method.value}>
              {method.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  )
}
