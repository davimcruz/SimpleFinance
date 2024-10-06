import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ParcelType {
  parcelaId: string
  valorParcela: number
  mes: number
  ano: number
  transacao: {
    nome: string
    tipo: string
    fonte: string
  }
}

interface ParcelsTableProps {
  parcelas: ParcelType[]
}

export const ParcelsTable: React.FC<ParcelsTableProps> = ({ parcelas }) => {
  return (
    <div className="max-h-[400px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Nome</TableHead>
            <TableHead className="text-center">Valor</TableHead>
            <TableHead className="text-right">Vencimento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parcelas.map((parcela) => (
            <TableRow key={parcela.parcelaId}>
            
              <TableCell className="font-medium">
                {parcela.transacao.nome}
              </TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(parcela.valorParcela)}
              </TableCell>
              <TableCell className="text-right">{`${parcela.mes}/${parcela.ano}`}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
