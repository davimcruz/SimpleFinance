import Link from "next/link"

import { ArrowUpRight, Plus } from "lucide-react"

import "../../app/globals.css"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const TransactionsTable = () => {
  return (
    <Card className="lg:col-span-2" x-chunk="dashboard-01-chunk-4">
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Transações</CardTitle>
          <CardDescription>
            Transações dos últimos
            <br className="lg:hidden" />{" "}
            <span className="font-semibold">30 dias:</span>
          </CardDescription>
        </div>
        <Button
          variant="outline"
          asChild
          size="sm"
          className="ml-auto gap-1 hidden lg:flex"
        >
          <Link href="/dashboard/transactions">
            Ver Todas
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="sm" className="ml-auto lg:ml-4 gap-1">
          <Link href="#">
            Adicionar
            <Plus className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="table-cell">Transação</TableHead>
              <TableHead className="sm:opacity-0 md:hidden lg:hidden"></TableHead>
              <TableHead className="hidden lg:table-cell md:table-cell">Tipo</TableHead>
              <TableHead className="hidden lg:table-cell">Fonte</TableHead>
              <TableHead className="hidden lg:table-cell">Data</TableHead>
              <TableHead className="ml-auto">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <div className="font-medium">Tênis Air Jordan</div>
              </TableCell>
              <TableCell>
                <Badge
                  className="hidden lg:inline-flex md:inline-flex text-xs"
                  variant="outline"
                >
                  Despesa
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                Cartão de Crédito
                <br />
                <div className="hidden text-sm text-muted-foreground md:inline">
                  Mastercard Inter Black
                </div>
              </TableCell>

              <TableCell className="hidden lg:table-cell">07/04/2024</TableCell>
              <TableCell className="sm:whitespace-nowrap sm:text-sm md:text-base">
                R$ 250,00
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <div className="font-medium">Dividendos ITSA4</div>
              </TableCell>
              <TableCell>
                <Badge
                  className="hidden lg:inline-flex md:inline-flex text-xs"
                  variant="outline"
                >
                  Receita
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                Investimentos
                <br />
                <div className="hidden text-sm text-muted-foreground md:inline">
                  XP Investimentos
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">07/04/2024</TableCell>
              <TableCell className="sm:whitespace-nowrap sm:text-sm md:text-base">
                R$ 53,42
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <div className="font-medium">Burger King</div>
              </TableCell>
              <TableCell>
                <Badge
                  className="hidden lg:inline-flex md:inline-flex text-xs"
                  variant="outline"
                >
                  Despesa
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                PIX
                <br />
                <div className="hidden text-sm text-muted-foreground md:inline">
                  Conta Pessoa Física Inter
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">06/04/2024</TableCell>
              <TableCell className="sm:whitespace-nowrap sm:text-sm md:text-base">
                R$ 24,90
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <div className="font-medium">Faculdade</div>
              </TableCell>
              <TableCell>
                <Badge
                  className="hidden lg:inline-flex md:inline-flex text-xs"
                  variant="outline"
                >
                  Despesa
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                Boleto Bancário
                <br />
                <div className="hidden text-sm text-muted-foreground md:inline">
                  Conta Pessoa Física Inter
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">05/04/2024</TableCell>
              <TableCell className="sm:whitespace-nowrap sm:text-sm md:text-base">
                R$ 370,00
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <div className="font-medium">Pró-Labore</div>
              </TableCell>
              <TableCell>
                <Badge
                  className="hidden lg:inline-flex md:inline-flex text-xs"
                  variant="outline"
                >
                  Receita
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                TED
                <br />
                <div className="hidden text-sm text-muted-foreground md:inline">
                  Conta Pessoa Jurídica Inter
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">05/04/2024</TableCell>
              <TableCell className="sm:whitespace-nowrap sm:text-sm md:text-base">
                R$ 9.800,00
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      <div className="flex justify-center items-center pb-6 px-6">
        <Button
          variant="outline"
          asChild
          size="sm"
          className="lg:hidden w-full"
        >
          <Link href="/dashboard/transactions">
            Ver Todas Transações
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}

export default TransactionsTable
