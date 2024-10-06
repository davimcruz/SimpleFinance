import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { DataTable } from "@/components/ui/DataTable"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { columns } from "./BillColumns"
import { ParcelsTable } from "./ParcelsTable"

interface BillType {
  faturaId: string
  mes: number
  ano: number
  valorTotal: number
  vencimento: string
}

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

interface BillsTableProps {
  cardId: string
}

const BillsTable: React.FC<BillsTableProps> = ({ cardId }) => {
  const [bills, setBills] = useState<BillType[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [nomeCartao, setNomeCartao] = useState("")
  const [selectedFaturaId, setSelectedFaturaId] = useState<string | null>(null)
  const [parcelas, setParcelas] = useState<ParcelType[]>([])
  const [loadingParcelas, setLoadingParcelas] = useState<boolean>(false)

  const router = useRouter()

  const handleBackClick = () => {
    router.push("/dashboard/cards")
  }

  useEffect(() => {
    const fetchCardName = async () => {
      try {
        const response = await fetch(`/api/Cards/Functions/getCardName`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cardId }),
        })

        const data = await response.json()
        if (data.nomeCartao) {
          setNomeCartao(data.nomeCartao)
        }
      } catch (error) {
        console.error("Erro ao buscar o nome do cartão:", error)
      }
    }

    fetchCardName()
  }, [cardId])

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/Queries/queryBill", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cardId }),
        })

        const data = await response.json()
        console.log("Dados recebidos:", data)

        if (Array.isArray(data.faturas)) {
          setBills(data.faturas)
        } else {
          console.error("A resposta da API não é um array.")
        }
      } catch (error) {
        console.error("Erro ao buscar faturas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBills()
  }, [cardId])

  const fetchParcels = async (faturaId: string) => {
    setLoadingParcelas(true)
    try {
      const response = await fetch(
        `/api/Queries/queryParcels?faturaId=${faturaId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      const data = await response.json()
      if (Array.isArray(data)) {
        setParcelas(data)
      } else {
        console.error("A resposta da API não é um array.")
      }
    } catch (error) {
      console.error("Erro ao buscar parcelas:", error)
    } finally {
      setLoadingParcelas(false)
    }
  }

  const handleBillClick = (faturaId: string) => {
    setSelectedFaturaId(faturaId)
    fetchParcels(faturaId)
  }

  const filteredBills = bills.filter(
    (bill) =>
      bill.mes.toString() || bill.ano.toString() || bill.valorTotal.toString()
  )

  return (
    <div className="flex justify-center items-center w-full">
      <Card className="m-12 md:min-w-[600px] max-w-[100vw]">
        <CardHeader className="flex-col md:flex-row items-center justify-between">
          <div className="flex-col">
            <CardTitle className="text-center md:text-start">
              Faturas em Aberto
            </CardTitle>
            <CardDescription>
              Todas as faturas abertas para:{" "}
              <span className="font-semibold">{nomeCartao}</span>
            </CardDescription>
          </div>
          <div className="flex items-center">
            <Button
              onClick={handleBackClick}
              variant={"outline"}
              className="mt-4 md:mt-0 cursor-pointer"
            >
              <LogOut className="mr-2" /> Sair da Fatura
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[250px]" />
          ) : bills.length === 0 ? (
            <div className="text-center justify-center items-center pt-20">
              <p>Você não possui Faturas em Aberto</p>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center justify-center items-center pt-20">
              <p>Nenhuma fatura encontrada</p>
            </div>
          ) : (
            <div className="w-full max-w-[100vw] flex">
              <DataTable<BillType, unknown>
                columns={columns(handleBillClick)}
                data={filteredBills}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!selectedFaturaId}
        onOpenChange={() => setSelectedFaturaId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Parcelas da Fatura</AlertDialogTitle>
          </AlertDialogHeader>
          {loadingParcelas ? (
            <Skeleton className="h-[150px]" />
          ) : parcelas.length === 0 ? (
            <p>Nenhuma parcela encontrada para esta fatura.</p>
          ) : (
            <ParcelsTable parcelas={parcelas} />
          )}
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setSelectedFaturaId(null)}>
              Fechar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default BillsTable
