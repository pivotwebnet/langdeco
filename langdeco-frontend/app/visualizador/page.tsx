import type { Metadata } from 'next'
import { getProducts } from '@/lib/api'
import { toProduct } from '@/lib/product-mapper'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Visualizador } from '@/components/sections/Visualizador'
import { ScrollAnimator } from '@/components/ui/ScrollAnimator'
import * as Icon from '@/components/ui/Icon'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Visualizador de espacios — LasLangDeco',
  description: 'Subí una foto de tu espacio y probá los muebles del catálogo antes de comprar.',
}

export default async function VisualizadorPage() {
  const products = await getProducts()

  return (
    <>
      <ScrollAnimator />
      <Header />
      <main style={{ paddingTop: 'var(--header-h)', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: 'var(--ink-mute)', textDecoration: 'none',
              fontFamily: 'ui-monospace, monospace', fontSize: 9,
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}
          >
            <Icon.Arrow style={{ transform: 'rotate(180deg)', width: 14, height: 14 }} />
            Inicio
          </Link>
        </div>
        <Visualizador products={products.map(toProduct)} />
      </main>
      <Footer />
    </>
  )
}
