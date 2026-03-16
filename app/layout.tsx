import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'leaflet/dist/leaflet.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgroConnect Argentina - Marketplace de Servicios Agropecuarios',
  description: 'Plataforma que conecta productores con prestadores de servicios agropecuarios en toda Argentina',
  keywords: 'agricultura, servicios agropecuarios, pulverización, siembra, cosecha, flete, Argentina',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-AR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
