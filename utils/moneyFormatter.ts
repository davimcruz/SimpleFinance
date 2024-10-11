export const formatToCurrency = (value: number | string): string => {
  const numericValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "."))
      : value
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)
}

export const parseCurrencyToFloat = (value: string | undefined | null): number => {
  if (!value) return 0;
  return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

export const handleCurrencyInput = (value: string): string => {
  const numericValue = value.replace(/\D/g, "")
  const floatValue = parseInt(numericValue) / 100
  return formatToCurrency(floatValue)
}

export const useCurrencyInput = (initialValue: string = "R$ 0,00") => {
  const format = (value: string): string => {
    const rawValue = value.replace(/[^\d]/g, '')
    if (rawValue === "") {
      return "R$ 0,00"
    }
    const numericValue = parseInt(rawValue, 10) / 100
    return formatToCurrency(numericValue)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): string => {
    return format(e.target.value)
  }

  const handleFocus = (value: string): string => {
    return value === "R$ 0,00" ? "" : value
  }

  const handleBlur = (value: string): string => {
    const numericValue = parseCurrencyToFloat(value)
    return numericValue < 1 ? "R$ 1,00" : format(value)
  }

  return {
    format,
    handleChange,
    handleFocus,
    handleBlur,
    initialValue,
  }
}
