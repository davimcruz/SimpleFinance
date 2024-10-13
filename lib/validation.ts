import { z } from "zod"
import { parseCurrencyToFloat } from "@/utils/moneyFormatter"

export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Formato de email inválido." })
    .max(100, { message: "O email excede o tamanho máximo permitido." }),
  password: z
    .string()
    .min(6, { message: "A senha deve ter pelo menos 6 caracteres." })
    .max(100, { message: "A senha excede o tamanho máximo permitido." }),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  nome: z
    .string()
    .min(1, { message: "O nome é obrigatório." })
    .max(100, { message: "O nome excede o tamanho máximo permitido." }),
  sobrenome: z
    .string()
    .min(1, { message: "O sobrenome é obrigatório." })
    .max(100, { message: "O sobrenome excede o tamanho máximo permitido." }),
  email: z
    .string()
    .email({ message: "Formato de email inválido." })
    .max(100, { message: "O email excede o tamanho máximo permitido." }),
  password: z
    .string()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
    .max(100, { message: "A senha excede o tamanho máximo permitido." }),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const transactionSchema = z.object({
  nome: z.string()
    .min(1, { message: "O nome não pode estar vazio." })
    .refine((value) => /^[a-zA-ZÀ-ÿ0-9\s]+$/.test(value), 
      { message: "O nome deve conter apenas letras (incluindo acentuadas), números e espaços." }),
  tipo: z.enum(["receita", "despesa"], { message: "Tipo deve ser 'receita' ou 'despesa'" }),
  fonte: z.string().min(1, { message: "Fonte é obrigatória" }),
  data: z.string().refine(
    (date) => /^\d{2}-\d{2}-\d{4}$/.test(date) || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(date),
    { message: "Data deve estar no formato DD-MM-YYYY ou ISO (yyyy-mm-ddTHH:MM:SS.sssZ)" }
  ),
  valor: z.string().refine(
    (value) => parseCurrencyToFloat(value) >= 1,
    { message: "O valor mínimo é R$ 1,00" }
  ),
  cardId: z.string().uuid({ message: "cardId deve ser um UUID válido" }).optional(),
  creditPaymentType: z.enum(["a-vista", "a-prazo"]).optional(),
  parcelas: z.string().optional(),
  detalhesFonte: z.string().optional(),
})

export type TransactionFormData = z.infer<typeof transactionSchema>

export const createCardSchema = z.object({
  userId: z.number().positive(),
  nome: z.string().min(1, { message: "Nome do cartão é obrigatório" })
    .regex(/^[a-zA-ZÀ-ÿ0-9\s]+$/, { message: "O nome deve conter apenas letras (incluindo acentuadas), números e espaços." }),
  bandeira: z.enum(["Mastercard", "Visa", "Elo", "American Express", "Hipercard"], {
    errorMap: () => ({ message: "Bandeira inválida" })
  }),
  instituicao: z.string().min(1, { message: "Instituição é obrigatória" })
    .regex(/^[a-zA-ZÀ-ÿ0-9\s]+$/, { message: "A instituição deve conter apenas letras (incluindo acentuadas), números e espaços." }),
  tipo: z.literal("credito"),
  vencimento: z.number().min(1).max(31, { message: "Vencimento deve ser entre 1 e 31" }),
  limite: z.number().min(0.01, { message: "Limite deve ser maior que zero" }),
})

export type CreateCardInput = z.infer<typeof createCardSchema>

export const updateCardSchema = z.object({
  cardId: z.string().uuid({ message: "cardId deve ser um UUID válido" }),
  nome: z.string().min(1, { message: "Nome do cartão é obrigatório" })
    .regex(/^[a-zA-ZÀ-ÿ0-9\s]+$/, { message: "O nome deve conter apenas letras (incluindo acentuadas), números e espaços." })
    .optional(),
  bandeira: z.enum(["Mastercard", "Visa", "Elo", "American Express", "Hipercard"], {
    errorMap: () => ({ message: "Bandeira inválida" })
  }).optional(),
  instituicao: z.string().min(1, { message: "Instituição é obrigatória" })
    .regex(/^[a-zA-ZÀ-ÿ0-9\s]+$/, { message: "A instituição deve conter apenas letras (incluindo acentuadas), números e espaços." })
    .optional(),
  vencimento: z.number().min(1).max(31, { message: "Vencimento deve ser entre 1 e 31" }).optional(),
  limite: z.number().min(0.01, { message: "Limite deve ser maior que zero" }).optional(),
})

export type UpdateCardInput = z.infer<typeof updateCardSchema>
