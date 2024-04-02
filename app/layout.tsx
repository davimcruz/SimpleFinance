import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Simple Finance",
  description: "Simple Finance - Your personal finances software",
  keywords: [
    "Simple",
    "Simple Finance",
    "Finances",
    "Finances Control",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/profile.jpg" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
