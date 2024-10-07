import { useState } from "react"
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card"
import { Separator } from "../ui/separator"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

const ManageUsersComponent = () => {
  const [ids, setIds] = useState("")
  const [userNames, setUserNames] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleFetchUsers = async () => {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    const formattedIds = ids
      .split(/[,;.]+/)
      .map((id) => id.trim())
      .filter((id) => id)

    if (formattedIds.length === 0) {
      setError("Por favor, insira IDs válidos.")
      setLoading(false)
      return
    }

    try {
      const users = []

      for (const id of formattedIds) {
        const responseUser = await fetch(`/api/users/get-userid?id=${id}`)
        const responseBudget = await fetch(
          `/api/Queries/queryCurrentBudget?userId=${id}`
        )

        if (!responseUser.ok) {
          const data = await responseUser.json()
          throw new Error(data.error || "Erro ao buscar usuários.")
        }

        if (!responseBudget.ok) {
          const data = await responseBudget.json()
          throw new Error(data.error || "Erro ao buscar orçamento.")
        }

        const userData = await responseUser.json()
        const budgetData = await responseBudget.json()

        users.push(
          `${userData.id}: ${userData.nome} ${
            userData.sobrenome
          } - Orçamento: R$${budgetData.totalOrcamento.toFixed(2)}`
        )
      }

      setUserNames(users)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUsers = async () => {
    setDeleting(true)
    setError(null)
    setSuccessMessage(null)

    const formattedIds = ids
      .split(/[,;.]+/)
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id))

    if (formattedIds.length === 0) {
      setError("Por favor, insira IDs válidos.")
      setDeleting(false)
      return
    }

    try {
      const response = await fetch("/api/users/delete-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: formattedIds }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao excluir usuários.")
      }

      setUserNames([])
      setIds("")
      setSuccessMessage("Usuários excluídos com sucesso!")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteTransactions = async () => {
    setDeleting(true)
    setError(null)
    setSuccessMessage(null)

    const formattedIds = ids
      .split(/[,;.]+/)
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id))

    if (formattedIds.length === 0) {
      setError("Por favor, insira IDs válidos.")
      setDeleting(false)
      return
    }

    try {
      const response = await fetch("/api/users/delete-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: formattedIds }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao excluir transações.")
      }

      setSuccessMessage("Transações excluídas com sucesso!")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteBudgets = async () => {
    setDeleting(true)
    setError(null)
    setSuccessMessage(null)

    const formattedIds = ids
      .split(/[,;.]+/)
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id))

    if (formattedIds.length === 0) {
      setError("Por favor, insira IDs válidos.")
      setDeleting(false)
      return
    }

    try {
      const response = await fetch("/api/users/delete-budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: formattedIds }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao excluir orçamentos.")
      }

      setSuccessMessage("Orçamentos excluídos com sucesso!")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="w-[90vw] lg:w-[400px] flex-row">
      <CardTitle className="flex text-2xl pt-10 items-center justify-center">
        Gerenciar Usuários
      </CardTitle>
      <CardDescription className="pt-4 text-center">
        Insira os IDs dos usuários que deseja gerenciar
      </CardDescription>
      <Separator className="mt-10" />
      <CardContent className="pt-10 pl-4 pb-3">
        <div className="grid max-w-sm gap-5 mx-auto">
          <div>
            <Label htmlFor="ids">
              IDs dos Usuários (separados por vírgula):
            </Label>
            <Input
              className="mt-2"
              type="text"
              id="ids"
              placeholder="Ex: 1, 2, 3"
              value={ids}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setIds(e.target.value)
              }
              required
            />
          </div>
          <Button
            className="mt-4 w-full"
            onClick={handleFetchUsers}
            disabled={loading || deleting}
          >
            {loading ? "Buscando usuários..." : "Consultar Usuários"}
          </Button>
        </div>

        {userNames.length > 0 && (
          <>
            <Separator className="my-6" />
            <div className="space-y-3">
              <Label>Usuários encontrados:</Label>
              <ul className="text-sm">
                {userNames.map((name, index) => (
                  <li key={index} className="list-disc ml-4">
                    {name}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full"
                onClick={handleDeleteTransactions}
                disabled={deleting || loading}
              >
                {deleting ? "Excluindo transações..." : "Excluir Transações"}
              </Button>
              <Button
                className="mt-4 w-full "
                onClick={handleDeleteBudgets}
                disabled={deleting || loading}
              >
                {deleting ? "Excluindo orçamentos..." : "Excluir Orçamentos"}
              </Button>
              <Button
                className="mt-4 w-full"
                variant={"destructive"}
                onClick={handleDeleteUsers}
                disabled={deleting || loading}
              >
                {deleting ? "Excluindo usuários..." : "Excluir Usuário(s)"}
              </Button>
            </div>
          </>
        )}
        {successMessage && (
          <p className="mt-4 text-center text-sm text-green-600">
            {successMessage}
          </p>
        )}
        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default ManageUsersComponent
