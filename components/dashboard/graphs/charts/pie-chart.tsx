"use client"
import { Pie, PieChart, ResponsiveContainer } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useEffect, useState } from "react"

// Definição do chartConfig para os meios de pagamento
const chartConfig = {
  paymentMethod: {
    label: "Método de Pagamento",
  },
  creditCard: {
    label: "Cartão de Crédito",
    color: "#2563eb",
  },
  debitCard: {
    label: "Cartão de Débito",
    color: "#60a5fa",
  },
  paypal: {
    label: "PayPal",
    color: "#34d399",
  },
  bankTransfer: {
    label: "Transferência Bancária",
    color: "#fbbf24",
  },
  other: {
    label: "Outro",
    color: "#f87171",
  },
} satisfies ChartConfig

const PieChartComponent = () => {
  const [chartData, setChartData] = useState<
    { method: string; amount: number }[]
  >([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/Queries/queryPaymentMethods")
        if (!response.ok) throw new Error("Erro 500")
        const data: { [method: string]: number } = await response.json()

        const formattedData = Object.keys(data).map((method) => ({
          method,
          amount: data[method],
        }))

        setChartData(formattedData)
      } catch (error) {
        console.error(error)
      }
    }

    fetchData()
  }, [])

  console.log(setChartData)

  return (
        
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="method"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              />
              <ChartLegend
                content={<ChartLegendContent nameKey="method" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

  )
}

export default PieChartComponent
