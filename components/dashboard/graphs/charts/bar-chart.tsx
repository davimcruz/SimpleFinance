"use client"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { useEffect, useState } from "react"

const chartConfig = {
  income: {
    label: "Receitas",
    color: "#2563eb",
  },
  expense: {
    label: "Despesas",
    color: "#60a5fa",
  },
} satisfies ChartConfig

const BarChartComponent = () => {
  const [chartData, setChartData] = useState<
    { month: string; income: number; expense: number }[]
  >([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/Queries/queryComparison")
        if (!response.ok) throw new Error("Erro 500")
        const data: { [month: string]: { income: number; expense: number } } =
          await response.json()

          console.log(data)

        const sortedMonths = Object.keys(data).sort(
          (a, b) => parseInt(a) - parseInt(b)
        )

        const translatedData = sortedMonths.map((month) => ({
          month: translateMonth(parseInt(month)),
          income: data[month].income,
          expense: data[month].expense,
        }))

        setChartData(translatedData)
      } catch (error) {
        console.error(error)
      }
    }


    fetchData()
  }, [])

  const translateMonth = (month: number) => {
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
    return monthNames[month - 1]
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="md:min-h-[400px] min-h-[180px] w-full"
    >
      <ResponsiveContainer width="100%" height={600}>
        <BarChart data={chartData}>
          <XAxis dataKey="month" />
          <YAxis />
          <CartesianGrid vertical={false} />
          <ChartTooltip
            content={<ChartTooltipContent labelKey="income" nameKey="month" />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="income"
            fill={chartConfig.income.color}
            radius={4}
            name="Receitas: R$"
          />
          <Bar
            dataKey="expense"
            fill={chartConfig.expense.color}
            radius={4}
            name="Despesas: R$"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export default BarChartComponent
