import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { InstallmentInput } from "./InstallmentInput"

interface CreditPaymentTypeSelectProps {
  paymentType: string
  onPaymentTypeChange: (value: string) => void
  installments: string
  onInstallmentsChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  error?: {
    paymentType?: string
    installments?: string
  }
}

export const CreditPaymentTypeSelect: React.FC<CreditPaymentTypeSelectProps> = ({
  paymentType,
  onPaymentTypeChange,
  installments,
  onInstallmentsChange,
  onBlur,
  error,
}) => {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="creditPaymentType">Tipo de Pagamento</Label>
        <Select value={paymentType} onValueChange={onPaymentTypeChange}>
          <SelectTrigger id="creditPaymentType">
            <SelectValue placeholder="Selecione o tipo de pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a-vista">À Vista</SelectItem>
            <SelectItem value="a-prazo">A Prazo</SelectItem>
          </SelectContent>
        </Select>
        {error?.paymentType && (
          <span className="text-red-500 text-sm">{error.paymentType}</span>
        )}
      </div>

      {paymentType === "a-prazo" && (
        <InstallmentInput
          value={installments}
          onChange={onInstallmentsChange}
          onBlur={onBlur}
          error={error?.installments}
        />
      )}
    </div>
  )
}
