import { useEffect, useState } from "react"
import "../../app/globals.css"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "../ui/skeleton"
import CreateTransactions from "./CreateTransactions"
import TransactionsDetails from "../dashboard/table/TransactionDetails"
import { Transactions } from "@/types/types"

type FonteKey =
  | "cartao-credito"
  | "cartao-debito"
  | "pix"
  | "boleto"
  | "investimentos"
  | "ted-doc"
  | "cedulas"

type SortKey = "nome" | "data" | "valor"

const TransactionsFull = () => {
  const [transactions, setTransactions] = useState<Transactions[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transactions[]
  >([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("data")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      const response = await fetch(
        "/api/transactions/get-table"
      )
      const data = await response.json()

      const sortedTransactions = data.table.sort(
        (a: Transactions, b: Transactions) => {
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
      setFilteredTransactions(sortedTransactions)
      setLoading(false)
    }

    fetchTransactions()
  }, [])

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredTransactions(transactions)
    } else {
      const filtered = transactions.filter((transaction) =>
        transaction.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredTransactions(filtered)
    }
  }, [searchTerm, transactions])

  const handleSort = (key: SortKey) => {
    let order: "asc" | "desc" = sortOrder === "asc" ? "desc" : "asc"
    if (sortKey !== key) {
      order = "asc"
    }

    const sorted = [...filteredTransactions].sort((a, b) => {
      if (key === "nome") {
        return order === "asc"
          ? a.nome.localeCompare(b.nome)
          : b.nome.localeCompare(a.nome)
      } else if (key === "data") {
        const dateA = new Date(a.data.split("-").reverse().join("/")).getTime()
        const dateB = new Date(b.data.split("-").reverse().join("/")).getTime()
        return order === "asc" ? dateA - dateB : dateB - dateA
      } else if (key === "valor") {
        return order === "asc" ? a.valor - b.valor : b.valor - a.valor
      }
      return 0
    })

    setFilteredTransactions(sorted)
    setSortKey(key)
    setSortOrder(order)
  }

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

  const formatValor = (valor: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(valor)
  }

  return (
    <div className="flex justify-center items-center">
      <Card className="m-12 w-[90vw]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transações</CardTitle>
          <div className="flex items-center">
            <Input
              placeholder="Pesquisar pelo Nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full mr-8 max-w-sm py-0 hidden lg:block"
            />
            <CreateTransactions />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[250px]" />
          ) : transactions.length === 0 ? (
            <div className="text-center justify-center items-center pt-20">
              <p>Você não possui Transações</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center justify-center items-center pt-20">
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort("nome")}>
                    Transação{" "}
                    {sortKey === "nome" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>

                  <TableHead className="hidden lg:table-cell md:table-cell">
                    Tipo
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Origem</TableHead>

                  <TableHead
                    onClick={() => handleSort("data")}
                    className="hidden lg:table-cell cursor-pointer"
                  >
                    Data{" "}
                    {sortKey === "data" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("valor")}
                    className="cursor-pointer hidden lg:table-cell"
                  >
                    Valor{" "}
                    {sortKey === "valor" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="ml-auto">Visualização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="font-medium">{transaction.nome}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
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
                        {transaction.fonte === "cartao-credito"
                          ? transaction.detalhesFonte || "Cartão de Crédito"
                          : transaction.detalhesFonte}
                      </div>
                    </TableCell>

                    <TableCell className="hidden lg:table-cell">
                      {transaction.data.replace(/-/g, "/")}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatValor(transaction.valor)}
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
