import { useEffect, useState, useMemo, useCallback } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip" 
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
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { parseCookies } from "nookies"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { CircleHelp } from "lucide-react"

interface BudgetComparison {
  month: number
  budget: number
  balanceRealocada: number
  balanceSemRealocacao: number
  statusRealocada: string
  statusSemRealocacao: string
  gapMoneyRealocada: number
  gapPercentageRealocada: string
  gapMoneySemRealocacao: number
  gapPercentageSemRealocacao: string
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
  padrao: "Sem receita",
  excedente: "Excedente",
  deficit: "Déficit",
  futuro: "Ainda sem receita",
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

const BalanceComparisonTable = () => {
  const [data, setData] = useState<BudgetComparison[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<keyof BudgetComparison>("month")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showPadrao, setShowPadrao] = useState(false)
  const [showCarryOver, setShowCarryOver] = useState(true)
  const [loading, setLoading] = useState(true)

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
          `/api/budget/comparisons/annual/get-balance?userId=${userId}`
        )
        if (!response.ok) {
          throw new Error("Erro ao buscar dados")
        }
        const result: BudgetComparison[] = await response.json()
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
      filtered = filtered.filter(
        (item) =>
          item.statusRealocada !== "padrao" &&
          item.statusSemRealocacao !== "padrao"
      )
    }

    if (searchTerm !== "") {
      filtered = filtered.filter(
        (item) =>
          monthNames[item.month]
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          statusTranslations[item.statusRealocada]
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          statusTranslations[item.statusSemRealocacao]
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      if (showCarryOver) {
        aValue = a[sortKey]
        bValue = b[sortKey]
      } else {
        const noCarryKey = sortKey.replace(
          "Realocada",
          "SemRealocacao"
        ) as keyof BudgetComparison
        aValue = a[noCarryKey]
        bValue = b[noCarryKey]
      }

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
  }, [data, searchTerm, showPadrao, showCarryOver, sortKey, sortOrder])

  const handleSort = useCallback((key: keyof BudgetComparison) => {
    setSortKey(key)
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"))
  }, [])

  return (
    <div className="flex justify-center items-center">
      <Card className="m-12 w-[90vw]">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-4">
          <CardTitle>Comparação Orçamento e Saldo</CardTitle>
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
                    Ao ativar, mostrará também os meses sem transações
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Switch
                checked={showPadrao}
                onCheckedChange={(checked) => setShowPadrao(checked)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-zinc-400 text-nowrap">
                Mostrar com Realocação
              </p>
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <span className="text-zinc-500 cursor-help">
                      <CircleHelp className="w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="rounded bg-background p-2 text-primary text-sm">
                    Ao desligar, fará a comparação sem realocação de saldo (Não
                    recomendado)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Switch
                checked={showCarryOver}
                onCheckedChange={(checked) => setShowCarryOver(checked)}
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
                    onClick={() =>
                      handleSort(
                        showCarryOver
                          ? "balanceRealocada"
                          : "balanceSemRealocacao"
                      )
                    }
                    className="cursor-pointer"
                  >
                    Saldo{" "}
                    {(sortKey === "balanceRealocada" ||
                      sortKey === "balanceSemRealocacao") &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    onClick={() =>
                      handleSort(
                        showCarryOver
                          ? "gapMoneyRealocada"
                          : "gapMoneySemRealocacao"
                      )
                    }
                    className="cursor-pointer"
                  >
                    Gap (R$){" "}
                    {(sortKey === "gapMoneyRealocada" ||
                      sortKey === "gapMoneySemRealocacao") &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    onClick={() =>
                      handleSort(
                        showCarryOver
                          ? "gapPercentageRealocada"
                          : "gapPercentageSemRealocacao"
                      )
                    }
                    className="cursor-pointer"
                  >
                    Gap (%){" "}
                    {(sortKey === "gapPercentageRealocada" ||
                      sortKey === "gapPercentageSemRealocacao") &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.map((item, index) => {
                  const balance = showCarryOver
                    ? item.balanceRealocada
                    : item.balanceSemRealocacao
                  const gapMoney = showCarryOver
                    ? item.gapMoneyRealocada
                    : item.gapMoneySemRealocacao
                  const gapPercentage = showCarryOver
                    ? item.gapPercentageRealocada
                    : item.gapPercentageSemRealocacao
                  const status = showCarryOver
                    ? item.statusRealocada
                    : item.statusSemRealocacao

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
                        {status === "padrao"
                          ? "-"
                          : new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(balance)}
                      </TableCell>
                      <TableCell>
                        {status === "padrao"
                          ? "-"
                          : new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(gapMoney)}
                      </TableCell>
                      <TableCell>
                        {status === "padrao" ? "-" : gapPercentage}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getBadgeClass(status)}
                        >
                          {statusTranslations[status] || status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default BalanceComparisonTable
