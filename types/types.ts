export interface Transaction {
  userId: number
  nome: string
  tipo: string
  fonte: string
  detalhesFonte: string | null // Certifique-se de que está alinhado com o tipo real
  data: string | null // Certifique-se de que está alinhado com o tipo real
  valor: string | null // Certifique-se de que está alinhado com o tipo real
  dataCriacao: Date
  transactionId: string
}

export interface Transactions {
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
