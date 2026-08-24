import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="pd-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <span className="kicker" style={{ display: 'block', marginBottom: 14 }}>Error 404</span>
          <h1 className="display" style={{ fontSize: 32, margin: '0 0 16px' }}>
            Esta página no existe.
          </h1>
          <p className="edit" style={{ fontSize: 17, lineHeight: 1.5, color: 'var(--ink-soft)', margin: '0 0 28px' }}>
            Puede que el link esté roto o la página se haya movido.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/catalogo" className="btn" style={{ textDecoration: 'none' }}>Ver el catálogo</Link>
            <Link href="/" className="btn ghost" style={{ textDecoration: 'none' }}>Volver al inicio</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
