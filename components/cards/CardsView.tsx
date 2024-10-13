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
import { Trash2, PencilLine } from "lucide-react"
import CreateCreditCard from "./CreateCards"
import UpdateCard from "./UpdateCards"

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
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
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
          const sortedCards = data.cartoes.sort((a: CardType, b: CardType) => {
            const limiteA = a.limite ? parseFloat(a.limite) : 0
            const limiteB = b.limite ? parseFloat(b.limite) : 0
            return limiteB - limiteA
          })
          setCards(sortedCards)
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
      const response = await fetch(`/api/cards/delete-cards`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardId, userId: Number(userId) }),
      })

      const data = await response.json()
      if (response.ok) {
        setTimeout(() => {
          router.reload()
        }, 500) 
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

  const handleEditCard = (cardId: string) => {
    setEditingCardId(cardId)
  }

  const handleCancelEdit = () => {
    setEditingCardId(null)
  }

  if (showCreateCard) {
    return <CreateCreditCard onCancel={() => setShowCreateCard(false)} />
  }

  if (editingCardId) {
    return <UpdateCard cardId={editingCardId} onCancel={handleCancelEdit} />
  }

  return (
    <>
      {/* Versão Mobile */}
      <div className="sm:hidden flex flex-col bg-card h-[calc(100vh-64px)]">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Cartões de Crédito</h1>
          <p className="text-muted-foreground mt-2">
            Clique no cartão que deseja visualizar
          </p>
        </div>
        <Separator />
        <div className="flex-grow overflow-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <LottieAnimation animationPath="/loading.json" />
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-grow space-y-4 overflow-auto">
                {creditCards.map((card) => (
                  <div
                    key={card.cardId}
                    className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleCardClick(card.cardId)}
                  >
                    <div className="flex items-center space-x-4">
                      {showManageCards && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCard(card.cardId)
                            }}
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingCardId(card.cardId)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold  ">{card.nomeCartao}</p>
                        <p className="text-sm  text-gray-500">{card.bandeira}</p>
                      </div>
                    </div>
                    {!showManageCards && (
                      <div className="flex flex-col">
                      <p className="text-sm font-medium text-end">
                        {formatCurrency(card.limite)}
                      </p>
                      <p className="text-sm text-end text-gray-500">Vencimento: {card.vencimento}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Button
                  onClick={() => setShowCreateCard(true)}
                  className="w-full"
                >
                  Adicionar Novo Cartão
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowManageCards((prev) => !prev)}
                  className="w-full"
                >
                  {showManageCards
                    ? "Cancelar Gerenciamento"
                    : "Gerenciar Cartões"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Versão Desktop */}
      <div className="hidden sm:flex justify-center items-center min-h-[90vh] p-4">
        <Card className="w-full max-w-[800px]">
          <CardTitle className="px-6 pt-6">Cartões de Crédito</CardTitle>
          <CardDescription className="px-6 mt-2">
            Clique no cartão que deseja visualizar
          </CardDescription>
          <Separator className="w-full mt-6" />
          <CardContent className="flex flex-col mt-8">
            {loading ? (
              <div className="flex justify-center items-center">
                <LottieAnimation animationPath="/loading.json" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {creditCards.map((card) => (
                    <div
                      key={card.cardId}
                      className="flex w-full sm:w-[400px] items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleCardClick(card.cardId)}
                    >
                      <div className="flex items-center space-x-4">
                        {showManageCards && (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditCard(card.cardId)
                              }}
                            >
                              <PencilLine className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeletingCardId(card.cardId)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold  ">{card.nomeCartao}</p>
                          <p className="text-sm  text-gray-500">{card.bandeira}</p>
                        </div>
                      </div>
                      {!showManageCards && (
                        <div className="flex flex-col">
                        <p className="text-sm font-medium text-end">
                          {formatCurrency(card.limite)}
                        </p>
                        <p className="text-sm text-end text-gray-500">Vencimento: {card.vencimento}</p>
                        </div>
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
        </Card>
      </div>

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
    </>
  )
}

export default CardsView
