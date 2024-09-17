export interface Transaction {
  userId: number
  nome: string
  tipo: string
  fonte: string
  detalhesFonte: string 
  data: string 
  valor: string 
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
