import { z } from "zod"

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
