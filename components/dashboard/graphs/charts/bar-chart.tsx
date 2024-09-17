import { useEffect, useRef } from "react"
import Chart from "chart.js/auto"

const BarChart = () => {
  const chartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/Queries/queryComparation")
        if (!response.ok) throw new Error("Erro 500")
        const data: { [month: string]: { income: number; expense: number } } =
          await response.json()

        renderChart(data)
      } catch (error) {
        console.error(error)
      }
    }

    fetchData()
  }, [])

  const renderChart = (data: {
    [month: string]: { income: number; expense: number }
  }) => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d")
      if (ctx) {
        const sortedMonths = Object.keys(data).sort(
          (a, b) => parseInt(a) - parseInt(b)
        )
        const translatedMonths = sortedMonths.map((month) =>
          translateMonth(parseInt(month))
        )
        const receitas = sortedMonths.map((month) => data[month].income)
        const despesas = sortedMonths.map((month) => data[month].expense)

        new Chart(ctx, {
          type: "bar",
          data: {
            labels: translatedMonths,
            datasets: [
              {
                label: "Income",
                data: receitas,
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
              },
              {
                label: "Expense",
                data: despesas,
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  generateLabels: function (chart) {
                    const defaultLabels =
                      Chart.defaults.plugins.legend.labels.generateLabels.call(
                        this,
                        chart
                      )
                    defaultLabels.forEach((label) => {
                      if (label.text === "Income") label.text = "Receitas"
                      if (label.text === "Expense") label.text = "Despesas"
                    })
                    return defaultLabels
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        })
      }
    }
  }

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

  return <canvas ref={chartRef} id="barChart"></canvas>
}

export default BarChart
