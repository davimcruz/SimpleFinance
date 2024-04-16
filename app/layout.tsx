import type { Metadata } from "next"
import Head from "next/head"
import "./globals.css"

export const metadata: Metadata = {
  title: "Simple Finance - Gerencie suas Finanças Facilmente",
  description:
    "Descubra o Simple Finance, o principal software de finanças pessoais projetado para ajudá-lo a gerenciar orçamentos, despesas e investimentos em um só lugar. Comece a controlar seu futuro financeiro hoje.",
  keywords: [
    "software de finanças pessoais",
    "gerenciamento de orçamento",
    "acompanhamento de despesas",
    "portfólio de investimentos",
    "planejamento financeiro",
    "Simple Finance",
    "gestão de dinheiro",
  ],
  robots: "index, follow",
  openGraph: {
    title: "Simple Finance - Seu Gerente de Finanças Pessoais",
    description:
      "Simplifique seu gerenciamento financeiro com o Simple Finance. Acompanhe despesas, gerencie orçamentos e supervisione seus investimentos com facilidade.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@SimpleFinance",
    title: "Simple Finance - Software de Finanças Pessoais",
    description:
      "Gerencie suas finanças sem esforço com o Simple Finance. Da elaboração de orçamentos ao acompanhamento de investimentos, obtenha tudo o que precisa para tomar controle da sua vida financeira.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <title>SimpleFinance</title>
        <meta
          name="description"
          content="Descubra o Simple Finance, o principal software de finanças pessoais projetado para ajudá-lo a gerenciar orçamentos, despesas e investimentos em um só lugar. Comece a controlar seu futuro financeiro hoje."
        />
        <meta
          name="keywords"
          content="software de finanças pessoais, gerenciamento de orçamento, acompanhamento de despesas, portfólio de investimentos, planejamento financeiro, Simple Finance, gestão de dinheiro"
        />
        <meta name="robots" content="index, follow" />
      </Head>
      <body>{children}</body>
    </html>
  )
}
