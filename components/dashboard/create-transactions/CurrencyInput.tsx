import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCurrencyInput } from "@/utils/moneyFormatter"

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
  const { handleChange, handleFocus, handleBlur, initialValue } = useCurrencyInput()

  const onChangeWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = handleChange(e)
    onChange(formattedValue)
  }

  const onFocusWrapper = (e: React.FocusEvent<HTMLInputElement>) => {
    const focusedValue = handleFocus(value)
    onChange(focusedValue)
  }

  const onBlurWrapper = () => {
    const blurredValue = handleBlur(value)
    onChange(blurredValue)
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
        value={value || initialValue}
        onChange={onChangeWrapper}
        onFocus={onFocusWrapper}
        onBlur={onBlurWrapper}
        required
      />
      {error && <span className="text-red-500 text-sm">Por favor, informe um valor válido para a transação.</span>}
    </div>
  )
}
