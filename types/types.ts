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

//Não excluir essa interface abaixo, ambas servem para um objetivo, note que não são iguals.
export interface Transactions {
  userId: number
  nome: string
  tipo: "receita" | "despesa"
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
  annualIncome: string;
  annualIncomeMessage: string;
  annualExpense: string;
  annualExpenseMessage: string;
  annualBalance: string;
  annualBalanceMessage: string;
  monthlyIncome: string;
  monthlyIncomeMessage: string;
  monthlyExpense: string;
  monthlyExpenseMessage: string;
}
