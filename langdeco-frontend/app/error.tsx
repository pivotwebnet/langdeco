'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <>
      <Header />
      <main className="pd-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <span className="kicker" style={{ display: 'block', marginBottom: 14 }}>Algo no salió bien</span>
          <h1 className="display" style={{ fontSize: 32, margin: '0 0 16px' }}>
            No pudimos cargar esta página.
          </h1>
          <p className="edit" style={{ fontSize: 17, lineHeight: 1.5, color: 'var(--ink-soft)', margin: '0 0 28px' }}>
            Puede ser algo temporal de conexión. Probá de nuevo en un momento, o volvé al inicio.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => reset()}>Reintentar</button>
            <Link href="/" className="btn ghost" style={{ textDecoration: 'none' }}>Volver al inicio</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
