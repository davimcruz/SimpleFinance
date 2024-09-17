export interface Transaction {
  userId: number
  nome: string
  tipo: string
  fonte: string
  detalhesFonte: string | null
  data: string | null
  valor: string | null
  dataCriacao: Date
  transactionId: string
}

export interface SummaryData {
  totalBalance: string
  totalAvailableThisMonth: string
  totalIncomeThisMonth: string
  totalExpenseThisMonth: string
  balanceDifference: string
  incomeDifference: string
  expenseDifference: string
}