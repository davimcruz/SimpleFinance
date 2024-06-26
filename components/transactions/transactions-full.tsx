import { useEffect, useState } from "react"

import "../../app/globals.css"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "../ui/skeleton"
import CreateTransaction from "./create-transaction"
import TransactionsDetails from "../dashboard/table/transactions-details"

interface Transaction {
  transactionId: string
  nome: string
  tipo: string
  fonte: string
  detalhesFonte: string
  data: string
  valor: string
}

type FonteKey =
  | "cartao-credito"
  | "cartao-debito"
  | "pix"
  | "boleto"
  | "investimentos"
  | "ted-doc"
  | "cedulas"

const TransactionsFull = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      const response = await fetch("/api/Transactions/transactionsTable")
      const data = await response.json()

      const sortedTransactions = data.table.sort(
        (a: Transaction, b: Transaction) => {
          const dateA = new Date(
            a.data.split("-").reverse().join("/")
          ).getTime()
          const dateB = new Date(
            b.data.split("-").reverse().join("/")
          ).getTime()
          return dateB - dateA
        }
      )

      setTransactions(sortedTransactions)
      setLoading(false)
    }

    fetchTransactions()
  }, [])

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }

  const mappings: { [key in FonteKey]?: string } = {
    "cartao-credito": "Cartão de Crédito",
    "cartao-debito": "Cartão de Débito",
    pix: "PIX",
    boleto: "Boleto",
    investimentos: "Investimentos",
    "ted-doc": "TED/DOC",
    cedulas: "Cédulas",
  }

  const formatFonte = (fonte: string): string => {
    const key = fonte as FonteKey
    return mappings[key] || fonte
  }

  const formatValor = (valor: string): string => {
    const hasComma = valor.includes(",")

    if (!hasComma) {
      valor += ",00"
    }

    let [inteira, decimal] = valor.split(",")

    inteira = inteira.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

    return `${inteira},${decimal}`
  }

  return (
    <div className="flex justify-center items-center">
      <Card className="m-12 w-[90vw]">
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Transações</CardTitle>
            <CardDescription>Transações mais Recentes:</CardDescription>
          </div>
          <CreateTransaction />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[250px]" />
          ) : transactions.length === 0 ? (
            <div className="text-center justify-center items-center pt-20">
              <p>Você não possui Transações</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="table-cell">Transação</TableHead>
                  <TableHead className="sm:opacity-0 md:hidden lg:hidden"></TableHead>
                  <TableHead className="hidden lg:table-cell md:table-cell">
                    Tipo
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Fonte</TableHead>
                  <TableHead className="hidden lg:table-cell">Data</TableHead>
                  <TableHead className="hidden lg:table-cell">Valor</TableHead>
                  <TableHead className="ml-auto">Visualização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="font-medium">{transaction.nome}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="hidden lg:inline-flex md:inline-flex text-xs"
                        variant="outline"
                      >
                        {capitalizeFirstLetter(transaction.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatFonte(transaction.fonte)}
                      <br />
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {transaction.detalhesFonte}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {transaction.data.replace(/-/g, "/")}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      R$ {formatValor(transaction.valor)}
                    </TableCell>
                    <TableCell className="">
                      <TransactionsDetails
                        transactionId={transaction.transactionId}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TransactionsFull
