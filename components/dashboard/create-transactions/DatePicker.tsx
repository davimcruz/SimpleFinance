import React from "react"
import { format, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Label } from "@/components/ui/label"

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  onBlur,
  error,
}) => {
  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const dia = String(selectedDate.getDate()).padStart(2, "0")
      const mes = String(selectedDate.getMonth() + 1).padStart(2, "0")
      const ano = selectedDate.getFullYear()
      onChange(`${dia}-${mes}-${ano}`)
    } else {
      onChange("")
    }
    onBlur()
  }

  return (
    <div className="grid gap-2">
      <Label className="text-left" htmlFor="dataTransacao">
        Data
      </Label>
      <Popover modal={false}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={`w-full justify-start text-left font-normal ${
              !value && "text-muted-foreground"
            }`}
            onClick={onBlur}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(parse(value, "dd-MM-yyyy", new Date()), "dd/MM/yyyy")
            ) : (
              <span>Selecione uma Data</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          style={{ zIndex: 9999, pointerEvents: "auto" }}
        >
          <div style={{ pointerEvents: "auto" }}>
            <Calendar
              locale={ptBR}
              mode="single"
              selected={
                value ? parse(value, "dd-MM-yyyy", new Date()) : undefined
              }
              onSelect={handleSelect}
              initialFocus
            />
          </div>
        </PopoverContent>
      </Popover>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  )
}
