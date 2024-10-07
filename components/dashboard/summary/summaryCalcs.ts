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
      totalBalance: formatCurrency(data.totalBalance ?? 0),
      totalAvailableThisMonth: formatCurrency(
        data.totalAvailableThisMonth ?? 0
      ),
      totalIncomeThisMonth: formatCurrency(data.totalIncomeThisMonth ?? 0),
      totalExpenseThisMonth: formatCurrency(data.totalExpenseThisMonth ?? 0),
      balanceThisMonth: formatCurrency(data.balanceThisMonth ?? 0),
      balanceDifference:
        data.balanceDifferenceString === "+Infinity%" ||
        data.balanceDifferenceString === "NaN%" ||
        !data.balanceDifferenceString
          ? "0%"
          : data.balanceDifferenceString,
      incomeDifference:
        data.incomeDifferenceString === "+Infinity%" ||
        data.incomeDifferenceString === "NaN%" ||
        !data.incomeDifferenceString
          ? "0%"
          : data.incomeDifferenceString,
      expenseDifference:
        data.expenseDifferenceString === "+Infinity%" ||
        data.expenseDifferenceString === "NaN%" ||
        !data.expenseDifferenceString
          ? "0%"
          : data.expenseDifferenceString,
    }
  } catch (error) {
    console.error("Erro ao buscar o total balance:", error)
    return {
      totalIncomeThisMonth: formatCurrency(0),
      totalExpenseThisMonth: formatCurrency(0),
      balanceThisMonth: formatCurrency(0),
      balanceDifference: "0%",
      incomeDifference: "0%",
      expenseDifference: "0%",
    }
  }
}

export const getServerSideProps: GetServerSideProps = async () => {
  const initialData = await fetchSummaryData()

  return {
    props: { initialData },
  }
}
