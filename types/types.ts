export interface Transaction {
  userId: number
  nome: string
  tipo: string
  fonte: string
  detalhesFonte: string | null
  data: string | null
  valor: number | null
  dataCriacao: Date
  transactionId: string
  cartoes?: {
    nomeCartao: string
  } | null
}

export interface Transactions {
  userId: number
  nome: string
  tipo: string
  fonte: string
  detalhesFonte: string
  data: string
  valor: number
  dataCriacao: Date
  transactionId: string
  cartoes?: {
    nomeCartao: string
  } | null
}

export interface SummaryData {
  totalIncomeThisMonth: string
  totalExpenseThisMonth: string
  balanceThisMonth: string 
  balanceDifference: string
  incomeDifference: string
  expenseDifference: string
  totalBalance?: string 
  totalAvailableThisMonth?: string 
}

