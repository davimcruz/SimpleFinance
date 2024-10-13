import React, { useEffect, useState } from "react"
import { parseCookies } from "nookies"
import CreateCards from "./CreateCards"
import CardsView from "./CardsView"
import CreateCreditCard from "./CreateCards"

interface CardType {
  nomeCartao: string
  bandeira: string
  limite?: string
  vencimento?: string
  tipoCartao: "credito" 
}

const CardsManager = () => {
  const [cards, setCards] = useState<CardType[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateCard, setShowCreateCard] = useState(false)

  const cookies = parseCookies()
  const userId = cookies.userId

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/cards/get-card?userId=${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )

        const data = await response.json()
        if (Array.isArray(data.cartoes)) {
          setCards(data.cartoes)
        } 
      } catch (error) {
        console.error("Erro ao buscar cartões:", error)
      }
      setLoading(false)
    }

    fetchCards()
  }, [userId])

  if (loading) {
    return null 
  }

  if (cards.length === 0) {
    return <CreateCards onCancel={() => setCards([])} />
  }

  if (showCreateCard) {
    return <CreateCreditCard onCancel={() => setShowCreateCard(false)} />
  }

  return (
    <div className="flex justify-center items-center max-h-[100vh] min-h-[90vh]">
      <CardsView />
    </div>
  )
}

export default CardsManager
