import type { Metadata } from 'next'
import { CartProvider, CartUIProvider } from '@/lib/cart'
import { WishlistProvider } from '@/lib/wishlist'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { CartDrawerHost } from '@/components/layout/CartDrawerHost'
import { SmoothScroll } from '@/components/ui/SmoothScroll'
import './globals.css'

export const metadata: Metadata = {
  title: 'LasLangDeco — Casa & Curaduría',
  description: 'Piezas escogidas a mano por nosotros, para hogares que no tienen prisa.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          <CartUIProvider>
            <WishlistProvider>
              <SmoothScroll />
              {children}
              <CartDrawerHost />
              <FloatingDock />
            </WishlistProvider>
          </CartUIProvider>
        </CartProvider>
      </body>
    </html>
  )
}
