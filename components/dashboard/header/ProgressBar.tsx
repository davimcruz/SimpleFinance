import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"

const ProgressBar = () => {
  const [progress, setProgress] = useState(0)
  const [dataCount, setDataCount] = useState(0)

  useEffect(() => {
    fetch("/api/Progress/progressTracker")
      .then((response) => response.json())
      .then((data) => {
        const progressPercentage = (data.count / 25) * 100
        setDataCount(data.count)
        setProgress(progressPercentage)
      })
      .catch((error) =>
        console.error("Erro ao buscar o número de transações:", error)
      )
  }, [])

  let transactionText
  if (dataCount === 25) {
    transactionText = "Você atingiu seu máximo de transações"
  } else {
    transactionText = `${dataCount}/25 Transações`
  }

  return (
    <div className="mr-0 lg:mr-4 flex-col">
      <p className="text-end text-xs mb-1">{transactionText}</p>
      <Progress
        value={progress}
        className="ml-auto h-2 w-full sm:w-full font-bold md:w-64 lg:w-64 bg-zinc-300 dark:bg-zinc-800"
      />
    </div>
  )
}

export default ProgressBar
