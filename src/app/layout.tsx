import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '../components/providers' // Changed this line

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FinanSync - Smart Financial Management',
  description: 'Advanced financial management with real-time updates and intelligent insights.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
