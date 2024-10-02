import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const debitCards = [
  {
    nome: "Cartão Débito Inter",
    primeirosDigitos: "1234",
    instituicao: "Banco Inter",
    bandeira: "Visa",
  },
  {
    nome: "Cartão Débito Caixa",
    primeirosDigitos: "4321",
    instituicao: "Caixa",
    bandeira: "Elo",
  },
  {
    nome: "Cartão Débito Itaú",
    primeirosDigitos: "1111",
    instituicao: "Itaú",
    bandeira: "Mastercard",
  },
]

const creditCards = [
  {
    nome: "Cartão Crédito Nubank",
    primeirosDigitos: "5678",
    instituicao: "Nubank",
    bandeira: "Mastercard",
    vencimento: "15-08",
  },
  {
    nome: "Cartão Crédito Bradesco",
    primeirosDigitos: "8765",
    instituicao: "Bradesco",
    bandeira: "Visa",
    vencimento: "22-05",
  },
  {
    nome: "Cartão Crédito Santander",
    primeirosDigitos: "2222",
    instituicao: "Santander",
    bandeira: "Visa",
    vencimento: "10-12",
  },
]

const CardsManager = () => {
  return (
    <div className="flex -mt-14 items-center min-h-screen">
      <div className="w-[25vw]">
        <Tabs defaultValue="debit" className="w-full">
          <TabsList className="mb-4 flex justify-center">
            <TabsTrigger value="debit" className="w-full">
              Cartões de Débito
            </TabsTrigger>
            <TabsTrigger value="credit" className="w-full">
              Cartões de Crédito
            </TabsTrigger>
          </TabsList>

          <TabsContent value="debit">
            <div className="flex flex-col gap-4">
              {debitCards.map((card, index) => (
                <Card
                  key={index}
                  className="dark:bg-zinc-950 bg-white shadow-md"
                >
                  <CardHeader>
                    <CardTitle>{card.nome}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Instituição: {card.instituicao}</p>
                    <p>4 Primeiros Dígitos: {card.primeirosDigitos}</p>
                    <p>Bandeira: {card.bandeira}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="credit">
            <div className="flex flex-col gap-4">
              {creditCards.map((card, index) => (
                <Card
                  key={index}
                  className="dark:bg-zinc-950 bg-white shadow-md"
                >
                  <CardHeader>
                    <CardTitle>{card.nome}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Instituição: {card.instituicao}</p>
                    <p>4 Primeiros Dígitos: {card.primeirosDigitos}</p>
                    <p>Vencimento: {card.vencimento}</p>
                    <p>Bandeira: {card.bandeira}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default CardsManager
