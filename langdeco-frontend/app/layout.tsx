import type { Metadata } from 'next'
import { CartProvider, CartUIProvider } from '@/lib/cart'
import { WishlistProvider } from '@/lib/wishlist'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { CartDrawerHost } from '@/components/layout/CartDrawerHost'
import { SmoothScroll } from '@/components/ui/SmoothScroll'
import { SITE_URL } from '@/lib/site-url'
import './globals.css'

const TITLE = 'LasLangDeco — Casa & Curaduría'
const DESCRIPTION = 'Piezas escogidas a mano por nosotros, para hogares que no tienen prisa.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'LasLangDeco',
    locale: 'es_AR',
    type: 'website',
    images: [{ url: '/assets/logo.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/assets/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
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
