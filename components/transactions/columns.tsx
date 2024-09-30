import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Transactions } from "@/types/types"
import TransactionsDetails from "@/components/dashboard/table/TransactionDetails"

type FonteKey =
  | "cartao-credito"
  | "cartao-debito"
  | "pix"
  | "boleto"
  | "investimentos"
  | "ted-doc"
  | "cedulas"

const mappings: { [key in FonteKey]?: string } = {
  "cartao-credito": "Cartão de Crédito",
  "cartao-debito": "Cartão de Débito",
  pix: "PIX",
  boleto: "Boleto",
  investimentos: "Investimentos",
  "ted-doc": "TED/DOC",
  cedulas: "Cédulas",
}

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
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

export const columns: ColumnDef<Transactions>[] = [
  {
    accessorKey: "nome",
    header: "Transação",
    cell: ({ row }) => row.getValue("nome") as string, 
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => (
      <Badge variant="outline">
        {capitalizeFirstLetter(row.getValue("tipo") as string)}
      </Badge>
    ),
  },
  {
    accessorKey: "fonte",
    header: "Fonte",
    cell: ({ row }) => {
      const fonte = row.getValue("fonte") as string
      return (
        <>
          {formatFonte(fonte)}
          <br />
          <span className="text-sm text-muted-foreground">
            {row.original.detalhesFonte}
          </span>
        </>
      )
    },
  },
  {
    accessorKey: "data",
    header: "Data",
    cell: ({ row }) => (row.getValue("data") as string).replace(/-/g, "/"),
  },
  {
    accessorKey: "valor",
    header: "Valor",
    cell: ({ row }) => formatValor(row.getValue("valor") as number),
  },
  {
    id: "actions",
    header: "Visualização",
    cell: ({ row }) => (
      <TransactionsDetails transactionId={row.original.transactionId} />
    ),
  },
]
