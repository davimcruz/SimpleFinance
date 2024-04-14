import { useEffect, useRef } from "react"
import Chart from "chart.js/auto"

interface PaymentMethodData {
  labels: string[]
  data: number[]
}

const PieChart = () => {
  const chartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch("/api/Queries/queryMethods")
        if (!response.ok) throw new Error("Network response was not ok")
        const methods: string[] = await response.json()

        const methodCounts = methods.reduce((acc, method) => {
          acc[method] = (acc[method] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const paymentMethodsData: PaymentMethodData = {
          labels: Object.keys(methodCounts),
          data: Object.values(methodCounts),
        }

        renderChart(paymentMethodsData)
      } catch (error) {
        console.error(error)
      }
    }

    fetchPaymentMethods()
  }, [])

  const translateLabel = (label: string): string => {
    switch (label) {
      case "cartao-debito":
        return "Cartão de Débito"
      case "cartao-credito":
        return "Cartão de Crédito"
      case "investimentos":
        return "Investimentos"
      case "pix":
        return "PIX"
      case "ted-doc":
        return "TED/DOC"
      case "boleto":
        return "Boleto"
      case "cedulas":
        return "Cédulas"
      default:
        return label
    }
  }

  const renderChart = (paymentMethodsData: PaymentMethodData) => {
    if (chartRef.current && paymentMethodsData.labels.length > 0) {
      const ctx = chartRef.current.getContext("2d")
      if (ctx) {
        new Chart(ctx, {
          type: "pie",
          data: {
            labels: paymentMethodsData.labels.map(translateLabel),
            datasets: [
              {
                label: "Principais Fontes de Despesas",
                data: paymentMethodsData.data,
                backgroundColor: [
                  "rgba(255, 99, 132, 0.2)",
                  "rgba(54, 162, 235, 0.2)",
                  "rgba(255, 206, 86, 0.2)",
                  "rgba(75, 192, 192, 0.2)",
                  "rgba(153, 102, 255, 0.2)",
                  "rgba(255, 159, 64, 0.2)",
                  "rgba(233, 30, 99, 0.2)",
                  "rgba(255, 87, 34, 0.2)",
                  "rgba(205, 220, 57, 0.2)",
                ],
                borderColor: [
                  "rgba(255, 99, 132, 1)",
                  "rgba(54, 162, 235, 1)",
                  "rgba(255, 206, 86, 1)",
                  "rgba(75, 192, 192, 1)",
                  "rgba(153, 102, 255, 1)",
                  "rgba(255, 159, 64, 1)",
                  "rgba(233, 30, 99, 1)",
                  "rgba(255, 87, 34, 1)",
                  "rgba(205, 220, 57, 1)",
                ],
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
              },
            },
          },
        })
      }
    }
  }

  return <canvas ref={chartRef} id="piechart"></canvas>
}

export default PieChart
