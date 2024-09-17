import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BarChart from "./charts/bar-chart"
import PieChart from "./charts/pie-chart"
import { Separator } from "../../ui/separator"
import { Skeleton } from "../../ui/skeleton"

const FinancesGraph = () => {
  const [loading, setLoading] = useState(true)
  const [transactionsExist, setTransactionsExist] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      const response = await fetch("/api/Queries/queryMethods")
      const data = await response.json()
      setTransactionsExist(data && data.length > 0)
      setLoading(false)
    }

    fetchTransactions()
  }, [])

  return (
    <Card x-chunk="dashboard-01-chunk-5">
      <CardHeader>
        <CardTitle>Resumos Gráficos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-center items-center max-w-[22rem] md:max-w-none">
        <div className="hidden sm:hidden md:flex lg:flex xl:flex">
          {loading ? (
            <Skeleton className="h-64 w-96 mt-6" />
          ) : transactionsExist ? (
            <Tabs
              defaultValue="bar"
              className="flex-col items-center justify-center text-center"
            >
              <TabsList className="items-center justify-center text-center">
                <TabsTrigger value="bar">Comparação Mensal</TabsTrigger>
                <TabsTrigger value="pie">Tipos de Transações</TabsTrigger>
              </TabsList>
              <TabsContent value="bar" className="w-full lg:h-96 lg:w-96 mt-8">
                <BarChart />
              </TabsContent>
              <TabsContent
                value="pie"
                className="w-full lg:h-80 lg:w-80 mt-16 ml-auto"
              >
                <PieChart />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-full mt-12">
              <p>Você não possui transações.</p>
            </div>
          )}
        </div>
        <div className="flex-col text-center justify-center items-center md:hidden ml-auto">
          {loading ? (
            <Skeleton className="w-full h-48 mb-8" />
          ) : transactionsExist ? (
            <>
              <div className="w-full h-auto mt-8">
                <BarChart />
              </div>
              <Separator className="w-full mt-8" />
              <div className="w-full h-64 mt-8">
                <PieChart />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Você não possui transações.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default FinancesGraph
