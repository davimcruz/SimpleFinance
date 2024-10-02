import { useEffect, useState } from "react"
import { parseCookies } from "nookies"

const ProgressBar = () => {
  const [progress, setProgress] = useState<number>(0) 
  const [budget, setBudget] = useState<number>(0) 
  const [expenses, setExpenses] = useState<number>(0) 

  useEffect(() => {
    const cookies = parseCookies()
    const userId = cookies.userId

    if (!userId) {
      console.error("User ID não encontrado nos cookies.")
      return
    }

    fetch("/api/Progress/progressTracker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }), 
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Dados retornados da API:", data)

        const { budget, expenses } = data

        if (typeof budget === "number" && typeof expenses === "number") {
          setBudget(budget) 
          setExpenses(expenses) 

          const calculatedProgress = Math.min((expenses / budget) * 100, 100)
          setProgress(calculatedProgress) 
        } else {
          console.error("Dados inválidos recebidos da API.")
        }
      })
      .catch((error) =>
        console.error("Erro ao buscar o orçamento comprometido:", error)
      )
  }, [])

  const progressText = `Orçamento Mensal Comprometido: ${progress.toFixed(2)}%`

  const progressBarColor =
    progress >= 75
      ? "bg-red-500"
      : progress >= 50
      ? "bg-yellow-500"
      : progress >= 30
      ? "bg-green-500"
      : "bg-blue-500"

  return (
    <div className="mr-0 lg:mr-4 flex-col">
      <p className="text-end text-xs mb-1">{progressText}</p>
      <div className="relative w-full sm:w-full md:w-64 lg:w-64 bg-zinc-300 dark:bg-zinc-800 h-2 rounded">
        <div
          className={`h-full rounded ${progressBarColor}`}
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  )
}

export default ProgressBar
