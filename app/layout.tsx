import type { Metadata } from 'next'
import { CartProvider } from '@/lib/cart'
import './globals.css'

export const metadata: Metadata = {
  title: 'LasLongDeco — Casa & Curaduría',
  description: 'Piezas escogidas a mano por Carmen Longo, para hogares que no tienen prisa.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
