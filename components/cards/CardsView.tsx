import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card"
import { Separator } from "../ui/separator"
import { parseCookies } from "nookies"
import LottieAnimation from "../ui/loadingAnimation"
import { Button } from "../ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { Trash2 } from "lucide-react"
import CreateCreditCard from "./CreateCards"

interface CardType {
  cardId: string
  nomeCartao: string
  bandeira: string
  limite?: string
  vencimento?: string
  tipoCartao: "credito"
}

const CardsView = () => {
  const [cards, setCards] = useState<CardType[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateCard, setShowCreateCard] = useState(false)
  const [showManageCards, setShowManageCards] = useState(false)
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const cookies = parseCookies()
  const userId = cookies.userId

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/cards/get-card?userId=${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()

        if (Array.isArray(data.cartoes)) {
          setCards(data.cartoes)
        } else {
          console.error("A resposta da API não é um array.")
        }
      } catch (error) {
        console.error("Erro ao buscar cartões:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [userId])

  const creditCards = cards.filter((card) => card.tipoCartao === "credito")

  const formatCurrency = (value: string | undefined) => {
    if (!value) return ""
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value))
  }

  const handleCardClick = (cardId: string) => {
    router.push(`/dashboard/cards/${cardId}`)
  }

  const handleDeleteCard = async (cardId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/cards/delete-card`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardId, userId: Number(userId) }),
      })

      const data = await response.json()
      if (response.ok) {
        setCards((prevCards) =>
          prevCards.filter((card) => card.cardId !== cardId)
        )
      } else {
        console.error("Erro ao deletar cartão:", data.error)
      }
    } catch (error) {
      console.error("Erro ao deletar cartão:", error)
    } finally {
      setIsDeleting(false)
      setDeletingCardId(null)
    }
  }

  if (showCreateCard) {
    return <CreateCreditCard />
  }

  return (
    <div className="flex justify-center items-center min-h-[90vh]">
      <Card className="w-[400px]">
        <CardTitle className="px-6 pt-6">Cartões de Crédito</CardTitle>
        <CardDescription className="px-6 mt-2">
          Clique no cartão que deseja visualizar
        </CardDescription>
        <Separator className="w-full mt-6" />
        <CardContent className="flex-col mt-8">
          {loading ? (
            <div className="flex justify-center items-center">
              <LottieAnimation animationPath="/loading.json" />
            </div>
          ) : (
            <>
              <div>
                {creditCards.map((card) => (
                  <div
                    key={card.cardId}
                    className={`flex justify-between p-4 m-4 border-[1px] rounded-lg cursor-pointer relative ${
                      showManageCards ? "text-end" : ""
                    }`}
                    onClick={() => handleCardClick(card.cardId)}
                  >
                    {showManageCards && (
                      <Button
                        variant="outline"
                        className=""
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingCardId(card.cardId)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="flex-col">
                      <p className="text-sm font-semibold">{card.nomeCartao}</p>
                      <p className="text-sm">{card.bandeira}</p>
                    </div>

                    {!showManageCards && (
                      <p className="text-sm text-end">
                        {formatCurrency(card.limite)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setShowCreateCard(true)}
                className="w-full mt-6"
              >
                Adicionar Novo Cartão
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowManageCards((prev) => !prev)}
                className="w-full mt-2"
              >
                {showManageCards
                  ? "Cancelar Gerenciamento"
                  : "Gerenciar Cartões"}
              </Button>
            </>
          )}
        </CardContent>

        <AlertDialog
          open={!!deletingCardId}
          onOpenChange={(isOpen) => !isOpen && setDeletingCardId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <p>
                Tem certeza que deseja excluir este cartão? <br /> <br />
                Todas as transações, parcelas e faturas vinculadas a ele também
                serão excluídas.
              </p>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setDeletingCardId(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deletingCardId) {
                    handleDeleteCard(deletingCardId)
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Excluindo..." : "Excluir Cartão"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isDeleting && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <LottieAnimation animationPath="./loading.json" />
          </div>
        )}
      </Card>
    </div>
  )
}

export default CardsView
