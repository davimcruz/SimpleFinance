const formatadorValor = (valor: string): string => {
  valor = valor.replace(/,/g, (match, offset, string) => {
    return string.indexOf(",") === offset ? match : ""
  })

  valor = valor.replace(/[^\d,]/g, "")

  const partes = valor.split(",")

  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  if (partes.length > 1) {
    const decimal = partes[1]
    partes[1] = decimal.slice(0, 2)
  }

  valor = partes.join(",")

  return valor
}

export default formatadorValor
