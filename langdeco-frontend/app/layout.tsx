import type { Metadata } from 'next'
import { CartProvider, CartUIProvider } from '@/lib/cart'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { FloatingCartButton } from '@/components/layout/FloatingCartButton'
import { CartDrawerHost } from '@/components/layout/CartDrawerHost'
import './globals.css'

export const metadata: Metadata = {
  title: 'LasLangDeco — Casa & Curaduría',
  description: 'Piezas escogidas a mano por nosotros, para hogares que no tienen prisa.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        <CartProvider>
          <CartUIProvider>
            {children}
            <CartDrawerHost />
            <FloatingCartButton />
            <FloatingDock />
          </CartUIProvider>
        </CartProvider>
      </body>
    </html>
  )
}
