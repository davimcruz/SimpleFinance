import { GetServerSideProps } from "next"

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export const fetchSummaryData = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/transactions/get-summary`
    )

    if (!response.ok) {
      throw new Error("Erro ao buscar dados da API")
    }

    const data = await response.json()

    return {
      annualIncome: formatCurrency(parseFloat(data.annualIncome) ?? 0),
      annualIncomeMessage: data.annualIncomeMessage ?? '',
      annualExpense: formatCurrency(parseFloat(data.annualExpense) ?? 0),
      annualExpenseMessage: data.annualExpenseMessage ?? '',
      annualBalance: formatCurrency(parseFloat(data.annualBalance) ?? 0),
      annualBalanceMessage: data.annualBalanceMessage ?? '',
    }
  } catch (error) {
    console.error("Erro ao buscar o resumo anual:", error)
    const currentYear = new Date().getFullYear()
    return {
      annualIncome: formatCurrency(0),
      annualIncomeMessage: `Total de receitas para o ano de ${currentYear}`,
      annualExpense: formatCurrency(0),
      annualExpenseMessage: `Total de despesas para o ano de ${currentYear}`,
      annualBalance: formatCurrency(0),
      annualBalanceMessage: `Saldo total para o ano de ${currentYear}`,
    }
  }
}

export const getServerSideProps: GetServerSideProps = async () => {
  const initialData = await fetchSummaryData()

  return {
    props: { initialData },
  }
}
