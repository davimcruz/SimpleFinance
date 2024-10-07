import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Simple Finance",
  description:
    "Descubra o Simple Finance, o principal software de finanças pessoais projetado para ajudá-lo a gerenciar orçamentos, despesas e cartões em um só lugar. Comece a controlar seu futuro financeiro hoje.",
  keywords: [
    "software de finanças pessoais",
    "gerenciamento de orçamento",
    "acompanhamento de despesas",
    "cartão de crédito",
    "planejamento financeiro",
    "Simple Finance",
    "gestão de dinheiro",
  ],
  robots: "index, follow",
  openGraph: {
    title: "Simple Finance - Seu Gerente de Finanças Pessoais",
    description:
      "Simplifique seu gerenciamento financeiro com o Simple Finance. Acompanhe despesas, gerencie orçamentos e supervisione seus cartões com facilidade.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
