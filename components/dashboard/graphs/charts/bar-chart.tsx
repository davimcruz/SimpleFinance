"use client"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { useEffect, useState } from "react"

const chartConfig = {
  income: {
    label: "Receita", // Alterado para "Receita"
    color: "#4bc0c0",
  },
  expense: {
    label: "Despesas", // Alterado para "Despesas"
    color: "#ff6384",
  },
} satisfies ChartConfig

const BarChartComponent = () => {
  const [chartData, setChartData] = useState<
    { month: string; income: number; expense: number }[]
  >([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/Queries/queryComparation")
        if (!response.ok) throw new Error("Erro 500")
        const data: { [month: string]: { income: number; expense: number } } =
          await response.json()

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
          <Tooltip
            formatter={(value: number, name: string) =>
              name === "income" ? ["Receita", value] : ["Despesas", value]
            }
          />
          <Legend
            formatter={(value) => (value === "income" ? "Receita" : "Despesas")}
          />
          <Bar
            dataKey="income"
            fill={chartConfig.income.color}
            radius={4}
            name="Receita"
          />
          <Bar
            dataKey="expense"
            fill={chartConfig.expense.color}
            radius={4}
            name="Despesas"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export default BarChartComponent
