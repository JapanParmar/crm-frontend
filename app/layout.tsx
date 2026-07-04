import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/providers/Providers'

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cosmica',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | BRICKroots CRM',
    default: 'BRICKroots CRM — Realty Beyond Imagination',
  },
  description: 'Enterprise real estate CRM for managing property leads, follow-ups, site visits, and sales pipeline.',
  keywords: ['real estate CRM', 'property leads', 'sales CRM', 'lead management'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full`}>
      <body className="h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
