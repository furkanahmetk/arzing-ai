import type { Metadata } from 'next'
import './globals.css'
import CsprClickProvider from './providers/CsprClickProvider'

export const metadata: Metadata = {
  title: 'Arzing AI — Autonomous Security & Network Intelligence',
  description:
    'AI-powered smart contract auditor and network health guardian for the Casper Network. Autonomous vulnerability detection, validator risk scoring, and real-time anomaly alerts.',
  keywords: ['Casper Network', 'smart contract audit', 'AI agent', 'security', 'validator monitoring', 'blockchain'],
  openGraph: {
    title: 'Arzing AI',
    description: 'Autonomous Security & Network Intelligence for Casper Network',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#050b14" />
      </head>
      <body id="root">
        <CsprClickProvider>
          {children}
        </CsprClickProvider>
      </body>
    </html>
  )
}
