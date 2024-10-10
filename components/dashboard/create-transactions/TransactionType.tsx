import React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface TransactionTypeSelectProps {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string
}

export const TransactionTypeSelect: React.FC<TransactionTypeSelectProps> = ({
  value,
  onChange,
  onBlur,
  error,
}) => {
  return (
    <div className="grid gap-2">
      <Label htmlFor="tipoTransacao">Tipo de Transação</Label>
      <Select value={value} onValueChange={onChange} onOpenChange={onBlur}>
        <SelectTrigger id="tipoTransacao">
          <SelectValue placeholder="Selecione o tipo de transação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="receita">Receita</SelectItem>
          <SelectItem value="despesa">Despesa</SelectItem>
        </SelectContent>
      </Select>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  )
}
