import type { Metadata } from 'next'
import { DM_Sans, Inter, Outfit, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/providers/Providers'

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cosmica',
  weight: ['300', '400', '500', '600', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
})

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700'],
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
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
    <html lang="en" className={`${dmSans.variable} ${inter.variable} ${outfit.variable} ${plusJakarta.variable} h-full`}>
      <body className="h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
