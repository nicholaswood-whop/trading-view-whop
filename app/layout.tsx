import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TradingView Indicators - Whop App',
  description: 'Sell access to your TradingView indicators through Whop',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
