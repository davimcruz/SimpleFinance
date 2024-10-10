import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  parseCurrencyToFloat,
} from "@/utils/moneyFormatter"

interface CurrencyInputProps {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string
  label?: string
  placeholder?: string
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  onBlur,
  error,
  label = "Valor",
  placeholder = "Exemplo: 199,90",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '')
    const numericValue = parseInt(rawValue, 10) / 100
    const formattedValue = numericValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    onChange(formattedValue)
  }

  const handleBlur = () => {
    const numericValue = parseCurrencyToFloat(value)
    if (numericValue < 1) {
      onChange("R$ 1,00")
    }
    onBlur()
  }

  return (
    <div className="grid gap-2">
      <Label className="text-left" htmlFor="valor">
        {label}
      </Label>
      <Input
        id="valor"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        required
      />
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  )
}
