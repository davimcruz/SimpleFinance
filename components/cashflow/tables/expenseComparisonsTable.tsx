import { useEffect, useState, useMemo, useCallback } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Card,
  CardContent,
  CardFooter,
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
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { parseCookies } from "nookies"
import { Switch } from "@/components/ui/switch"
import { CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/router"

interface ExpenseComparison {
  month: number
  budget: number
  despesaReal: number
  statusDespesa: string
  gapMoneyDespesa: number
  gapPercentageDespesa: string
}

const monthNames: { [key: number]: string } = {
  1: "Janeiro",
  2: "Fevereiro",
  3: "Março",
  4: "Abril",
  5: "Maio",
  6: "Junho",
  7: "Julho",
  8: "Agosto",
  9: "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro",
}

const statusTranslations: { [key: string]: string } = {
  padrao: "Sem despesa",
  excedente: "Excedente",
  deficit: "Déficit",
  futuro: "Ainda sem despesa",
}

const getBadgeClass = (status: string) => {
  switch (status) {
    case "excedente":
      return "border-blue-500"
    case "deficit":
      return "border-red-500"
    case "futuro":
      return "border-zinc-500"
    case "padrao":
      return "border-gray-500"
    default:
      return "border-gray-500"
  }
}

const ExpenseComparisonTable = () => {
  const [data, setData] = useState<ExpenseComparison[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<keyof ExpenseComparison>("month")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showPadrao, setShowPadrao] = useState(false)
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
        const response = await fetch(
          `/api/cashflow/comparisons/annual/get-expense?userId=${userId}`
        )
        if (!response.ok) {
          throw new Error("Erro ao buscar dados")
        }
        const result: ExpenseComparison[] = await response.json()
        setData(result)
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredAndSortedData = useMemo(() => {
    let filtered = data

    if (!showPadrao) {
      filtered = filtered.filter((item) => item.statusDespesa !== "padrao")
    }

    if (searchTerm !== "") {
      filtered = filtered.filter(
        (item) =>
          monthNames[item.month]
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          statusTranslations[item.statusDespesa]
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      aValue = a[sortKey]
      bValue = b[sortKey]

      if (sortKey === "month") {
        return sortOrder === "asc" ? a.month - b.month : b.month - a.month
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue
      } else {
        return sortOrder === "asc"
          ? aValue.toString().localeCompare(bValue.toString())
          : bValue.toString().localeCompare(aValue.toString())
      }
    })

    return sorted
  }, [data, searchTerm, showPadrao, sortKey, sortOrder])

  const handleSort = useCallback((key: keyof ExpenseComparison) => {
    setSortKey(key)
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"))
  }, [])

  const handleUpdateBudgetClick = () => {
    router.push("/dashboard/cashflow/updateFlow")
  }

  return (
    <div className="flex justify-center items-center">
      <Card className="m-12 w-[90vw]">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-4">
          <CardTitle>Comparação Orçamento e Despesas</CardTitle>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-2">
              <p className="text-xs text-zinc-400 text-nowrap">Mostrar Todos</p>
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <span className="text-zinc-500 cursor-help">
                      <CircleHelp className="w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="rounded bg-background p-2 text-primary text-sm">
                    Ao ativar, mostrará também os meses sem despesa
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Switch
                checked={showPadrao}
                onCheckedChange={(checked) => setShowPadrao(checked)}
              />
            </div>
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
                    onClick={() => handleSort("month")}
                    className="cursor-pointer"
                  >
                    Mês{" "}
                    {sortKey === "month" && (sortOrder === "asc" ? "↓" : "↑")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("budget")}
                    className="cursor-pointer"
                  >
                    Orçamento{" "}
                    {sortKey === "budget" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("despesaReal")}
                    className="cursor-pointer"
                  >
                    Despesa{" "}
                    {sortKey === "despesaReal" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("gapMoneyDespesa")}
                    className="cursor-pointer"
                  >
                    Gap (R$){" "}
                    {sortKey === "gapMoneyDespesa" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("gapPercentageDespesa")}
                    className="cursor-pointer"
                  >
                    Gap (%){" "}
                    {sortKey === "gapPercentageDespesa" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.map((item, index) => {
                  const isSemDespesa =
                    item.statusDespesa === "padrao" ||
                    item.statusDespesa === "sem despesa"
                  const isAindaSemDespesa = item.statusDespesa === "futuro"

                  return (
                    <TableRow key={index}>
                      <TableCell>{monthNames[item.month]}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.budget)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.despesaReal)}
                      </TableCell>
                      <TableCell>
                        {isSemDespesa || isAindaSemDespesa
                          ? "-"
                          : new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(item.gapMoneyDespesa)}
                      </TableCell>
                      <TableCell>
                        {isSemDespesa ? "-" : item.gapPercentageDespesa}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getBadgeClass(item.statusDespesa)}
                        >
                          {statusTranslations[item.statusDespesa] ||
                            item.statusDespesa}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
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
              Clique aqui para alterar seu orçamento
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  )
}

export default ExpenseComparisonTable
