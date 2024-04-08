import "../../app/globals.css"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

//LIMITE DE CARTA, QUANTO GASTOU NO PIX, QUANTO NO DINHEIRO, PROXIMAS FATURAS


const FinancesGraph = () => {
  return (
    <Card x-chunk="dashboard-01-chunk-5">
      <CardHeader>
        <CardTitle>Principais Fontes</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8">
        <div className="flex items-center gap-4">
          <Avatar className="hidden h-9 w-9 sm:flex">
            <AvatarFallback>PX</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <p className="text-sm font-medium leading-none">
              Transferências PIX
            </p>
            <p className="text-sm text-muted-foreground">
              Conta Pessoa Física Inter
            </p>
          </div>
          <div className="ml-auto flex-col text-right">
            <div className="ml-auto text-sm">Entradas: R$ 1.900,00</div>
            <div className="ml-auto text-sm">Saídas: R$ 900,00</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="hidden h-9 w-9 sm:flex">
            <AvatarFallback>CC</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <p className="text-sm font-medium leading-none">
              Cartão de Crédito
            </p>
            <p className="text-sm text-muted-foreground">
              Mastercard Inter Black
            </p>
          </div>
          <div className="ml-auto flex-col text-right">
            <div className="ml-auto text-sm">Gastos: R$ 3.400,00</div>
            <div className="ml-auto text-sm">Limite: R$ 6.000,00</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="hidden h-9 w-9 sm:flex">
            <AvatarFallback>XP</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <p className="text-sm font-medium leading-none">Investimentos</p>
            <p className="text-sm text-muted-foreground">XP Investimentos</p>
          </div>
          <div className="ml-auto flex-col text-right">
            <div className="ml-auto text-sm">Rendimentos: R$ 53,42</div>
            <div className="ml-auto text-sm">Investidos: R$ 5.430,00</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="hidden h-9 w-9 sm:flex">
            <AvatarFallback>BO</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <p className="text-sm font-medium leading-none">Boleto Bancário</p>
            <p className="text-sm text-muted-foreground">
              Conta Pessoa Física Inter
            </p>
          </div>
          <div className="ml-auto flex-col text-right">
            <div className="ml-auto text-sm">Saídas: R$ 370,00</div>
            <div className="ml-auto text-sm">Entradas: R$ 0,00</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default FinancesGraph
