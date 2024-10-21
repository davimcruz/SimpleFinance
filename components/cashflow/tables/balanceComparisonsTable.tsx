import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/router"
import { parseCookies } from "nookies"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"


interface FlowItem {
  mes: number
  nome: string
  receitaOrcada: number
  despesaOrcada: number
  saldoOrcado: number
  receitaRealizada: number
  despesaRealizada: number
  saldoRealizado: number
  gapMoney: number
  gapPercentage: number
  status: string
}

const statusTranslations: { [key: string]: string } = {
  excedente: "Excedente",
  deficit: "Déficit",
  neutro: "Neutro",
}

const getBadgeClass = (status: string) => {
  switch (status) {
    case "excedente":
      return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700"
    case "deficit":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-100 dark:border-red-700"
    case "neutro":
      return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-700"
    default:
      return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
  }
}

const BalanceComparisonTable = () => {
  const [data, setData] = useState<FlowItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<keyof FlowItem>("mes")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const cookies = parseCookies()
      const userId = cookies.userId

      if (!userId) {
        console.error("User ID não encontrado nos cookies.")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/cashflow/get-flow?userId=${userId}`)
        if (!response.ok) {
          throw new Error("Erro ao buscar dados")
        }
        const result = await response.json()
        console.log("Dados retornados pela API get-flow:", JSON.stringify(result, null, 2))
        setData(result.flows)
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredAndSortedData = useMemo(() => {
    let filtered = data

    if (searchTerm !== "") {
      filtered = filtered.filter(
        (item) =>
          item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          statusTranslations[item.status]?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return [...filtered].sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue
      } else {
        return sortOrder === "asc"
          ? aValue.toString().localeCompare(bValue.toString())
          : bValue.toString().localeCompare(aValue.toString())
      }
    })
  }, [data, searchTerm, sortKey, sortOrder])

  const handleSort = useCallback((key: keyof FlowItem) => {
    setSortKey(key)
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"))
  }, [])

  const handleUpdateBudgetClick = () => {
    router.push("/dashboard/cashflow/updateFlow")
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "-"
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "-"
    }
    const formattedValue = new Intl.NumberFormat("pt-BR", {
      style: "percent",
      signDisplay: "never",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value))
    
    return value > 0 ? `+${formattedValue}` : value < 0 ? `-${formattedValue}` : formattedValue
  }

  return (
    <div className="flex justify-center items-center">
      <Card className="m-12 w-[90vw]">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-4">
          <CardTitle>Fluxo de Caixa</CardTitle>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <Input
              placeholder="Pesquisar por mês ou status"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-sm py-0"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[250px]" />
          ) : filteredAndSortedData.length === 0 ? (
            <div className="text-center justify-center items-center pt-20">
              <p>Nenhuma comparação encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    onClick={() => handleSort("mes")}
                    className="cursor-pointer"
                  >
                    Mês {sortKey === "mes" && (sortOrder === "asc" ? "↓" : "↑")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("saldoOrcado")}
                    className="cursor-pointer"
                  >
                    Orçado{" "}
                    {sortKey === "saldoOrcado" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("saldoRealizado")}
                    className="cursor-pointer"
                  >
                    Realizado{" "}
                    {sortKey === "saldoRealizado" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("gapMoney")}
                    className="cursor-pointer"
                  >
                    Gap (R$){" "}
                    {sortKey === "gapMoney" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("gapPercentage")}
                    className="cursor-pointer"
                  >
                    Gap (%){" "}
                    {sortKey === "gapPercentage" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-semibold">{item.nome}</TableCell>
                    <TableCell>{formatCurrency(item.saldoOrcado)}</TableCell>
                    <TableCell>{formatCurrency(item.saldoRealizado)}</TableCell>
                    <TableCell>{formatCurrency(item.gapMoney)}</TableCell>
                    <TableCell>
                      {formatPercentage(item.gapPercentage)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getBadgeClass(item.status)}
                      >
                        {statusTranslations[item.status] || item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <div className="w-full flex">
          <CardFooter className="mx-auto">
            <Button
              variant={"link"}
              className="mt-4 -mb-4 text-sm text-zinc-500"
              onClick={handleUpdateBudgetClick}
            >
              Clique aqui para alterar seu orçamento{" "}
              <span className="lg:block hidden ml-1">mensal</span>
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  )
}

export default BalanceComparisonTable
