import React, { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { EllipsisVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/router"

interface BillType {
  faturaId: string
  mes: number
  ano: number
  valorTotal: number
  vencimento: string
}

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

export const columns = (
  handleBillClick: (faturaId: string) => void
): ColumnDef<BillType>[] => [
  {
    accessorKey: "mes",
    header: () => <div className="w-full inline-block text-center">Mês</div>,
    cell: ({ getValue }) => {
      const value = getValue<number>()
      return (
        <div className="w-full text-center">
          {value ? monthNames[value - 1] : ""}
        </div>
      )
    },
  },
  {
    accessorKey: "ano",
    header: () => (
      <div className="inline-block w-full text-center justify-center">Ano</div>
    ),
    cell: ({ getValue }) => {
      const value = getValue<number>()
      return <div className="flex w-full justify-center">{value || ""}</div>
    },
  },
  {
    accessorKey: "valorTotal",
    header: () => (
      <div className="hidden md:inline-block w-full text-center justify-center">
        Valor Total
      </div>
    ),
    cell: ({ getValue }) => {
      const value = getValue<number>()
      return (
        <div className="hidden md:flex w-full justify-center">
          {value !== undefined
            ? new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(value)
            : ""}
        </div>
      )
    },
  },
  {
    accessorKey: "vencimento",
    header: () => (
      <div className="hidden md:inline-block w-full text-center justify-center">
        Vencimento
      </div>
    ),
    cell: ({ getValue }) => {
      const value = getValue<string>()
      return (
        <div className="hidden md:flex w-full justify-center">
          {value ? new Date(value).toLocaleDateString("pt-BR") : ""}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: () => <div className="w-full text-center">Ações</div>,
    cell: function ActionsCell({ row }) {
      const router = useRouter()
      const [isPaying, setIsPaying] = useState(false)
      const [isDeleting, setIsDeleting] = useState(false)

      return (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            className="hidden md:inline-flex"
            onClick={async () => {
              setIsPaying(true)
              try {
                const response = await fetch("/api/Cards/CreditCard/payBills", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ faturaId: row.original.faturaId }),
                })

                if (!response.ok) {
                  throw new Error("Erro ao pagar fatura")
                }

                router.reload()
              } catch (error) {
                console.error("Erro ao pagar a fatura:", error)
              } finally {
                setIsPaying(false)
              }
            }}
          >
            {isPaying ? "Pagando Fatura..." : "Pagar Fatura"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-0">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => handleBillClick(row.original.faturaId)}
              >
                Verificar Parcelas
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() =>
                  navigator.clipboard.writeText(row.original.faturaId)
                }
              >
                Copiar ID
              </DropdownMenuItem>
              <Separator className="w-full my-1" />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={async () => {
                  setIsDeleting(true)
                  try {
                    const response = await fetch(
                      `/api/Cards/CreditCard/deleteBills?faturaId=${row.original.faturaId}`,
                      {
                        method: "DELETE",
                      }
                    )

                    if (!response.ok) {
                      throw new Error("Erro ao excluir fatura")
                    }

                    router.reload()
                  } catch (error) {
                    console.error("Erro ao excluir fatura:", error)
                  } finally {
                    setIsDeleting(false)
                  }
                }}
              >
                {isDeleting ? "Excluindo Fatura..." : "Excluir Fatura"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
