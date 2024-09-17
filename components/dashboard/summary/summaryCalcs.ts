import { GetServerSideProps } from "next"

export const addThousandSeparator = (value: string) => {
  return value.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export const fetchSummaryData = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/Transactions/transactionsSummary`
    )
    const data = await response.json()

    return {
      totalBalance: addThousandSeparator(
        data.totalBalance.toFixed(2).toString()
      ),
      totalAvailableThisMonth: addThousandSeparator(
        data.totalAvailableThisMonth.toFixed(2).toString()
      ),
      totalIncomeThisMonth: addThousandSeparator(
        data.totalIncomeThisMonth.toFixed(2).toString()
      ),
      totalExpenseThisMonth: addThousandSeparator(
        data.totalExpenseThisMonth.toFixed(2).toString()
      ),
      balanceDifference:
        data.balanceDifferenceString === "+Infinity%" ||
        data.balanceDifferenceString === "NaN%"
          ? "0%"
          : data.balanceDifferenceString,
      incomeDifference:
        data.incomeDifferenceString === "+Infinity%" ||
        data.incomeDifferenceString === "NaN%"
          ? "0%"
          : data.incomeDifferenceString,
      expenseDifference:
        data.expenseDifferenceString === "+Infinity%" ||
        data.expenseDifferenceString === "NaN%"
          ? "0%"
          : data.expenseDifferenceString,
    }
  } catch (error) {
    console.error("Erro ao buscar o total balance:", error)
    return null
  }
}

export const getServerSideProps: GetServerSideProps = async () => {
  const initialData = await fetchSummaryData()
  return {
    props: { initialData },
  }
}
