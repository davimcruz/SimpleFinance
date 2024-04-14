import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BarChart from "./charts/bar-chart"
import PieChart from "./charts/pie-chart"

const FinancesGraph = () => {
  return (
    <Card x-chunk="dashboard-01-chunk-5">
      <CardHeader>
        <CardTitle>Resumos Gráficos</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center items-center">
        <Tabs
          defaultValue="bar"
          className="flex-col items-center justify-center text-center"
        >
          <TabsList className="items-center justify-center">
            <TabsTrigger value="bar">Comparação Mensal</TabsTrigger>
            <TabsTrigger value="pie">Tipos de Transações</TabsTrigger>
          </TabsList>
          <TabsContent
            value="bar"
            className="lg:w-96 lg:h-96 sm:w-64 sm:h-64 mt-8"
          >
            <BarChart />
          </TabsContent>
          <TabsContent
            value="pie"
            className="lg:w-96 lg:h-96 sm:w-64 sm:h-64 mt-8"
          >
            <PieChart />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default FinancesGraph
