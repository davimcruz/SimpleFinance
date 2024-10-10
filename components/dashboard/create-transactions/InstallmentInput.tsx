import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface InstallmentInputProps {
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  error?: string
}

export const InstallmentInput: React.FC<InstallmentInputProps> = ({
  value,
  onChange,
  onBlur,
  error,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const num = parseInt(newValue, 10)

    if (newValue === "" || !isNaN(num)) {
      onChange({
        ...e,
        target: {
          ...e.target,
          value: newValue === "" ? "" : String(Math.min(12, Math.max(1, num))),
        },
      })
    }
  }

  const handleBlur = () => {
    onBlur()
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="parcelas">Número de Parcelas</Label>
      <Input
        id="parcelas"
        type="number"
        placeholder="1x"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        min={1}
        max={12}
      />
      {error && <span className="text-red-500 text-sm">Por favor, informe o número de parcelas (1 a 12).</span>}
    </div>
  )
}
