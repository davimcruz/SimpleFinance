import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BarChart from "./charts/bar-chart"
import PieChart from "./charts/pie-chart"
import { Separator } from "../ui/separator"

const FinancesGraph = () => {
  return (
    <Card x-chunk="dashboard-01-chunk-5">
      <CardHeader>
        <CardTitle>Resumos Gráficos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-center items-center">
        <div className="hidden sm:hidden md:flex lg:flex xl:flex">
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
              className="w-full lg:h-80 lg:w-80 mt-8 ml-auto"
            >
              <PieChart />
            </TabsContent>
          </Tabs>
        </div>
        <div className="flex flex-col md:hidden">
          <div className="w-full h-64 mt-8">
            <BarChart />
          </div>
          <Separator className="w-96 mt-8" />
          <div className="w-full h-64 mt-8">
            <PieChart />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default FinancesGraph
