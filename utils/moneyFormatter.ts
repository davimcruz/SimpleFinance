export const formatToCurrency = (value: number | string): string => {
  const numericValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "."))
      : value
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue)
}

export const parseCurrencyToFloat = (value: string): number => {
  return parseFloat(value.replace(/[^\d,]/g, "").replace(",", "."))
}

export const handleCurrencyInput = (value: string): string => {
  const numericValue = value.replace(/\D/g, "")
  const floatValue = parseInt(numericValue) / 100
  return formatToCurrency(floatValue)
}
