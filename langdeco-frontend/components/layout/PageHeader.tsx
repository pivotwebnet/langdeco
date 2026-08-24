import Link from 'next/link'
import * as Icon from '@/components/ui/Icon'
import type { ReactNode } from 'react'

interface Crumb {
  label: string
  href: string
}

interface PageHeaderProps {
  /** Current page name shown en el breadcrumb, ej. "Catálogo" o el nombre del producto */
  label: string
  /** Nivel intermedio opcional entre Inicio y label, ej. { label: 'Catálogo', href: '/catalogo' } */
  parent?: Crumb
  kicker?: string
  title?: ReactNode
  intro?: ReactNode
}

export function PageHeader({ label, parent, kicker, title, intro }: PageHeaderProps) {
  return (
    <>
      <nav className="pd-breadcrumb" aria-label="Miga de pan">
        <Link href="/" className="pd-back">
          <Icon.Arrow className="pd-back-arrow" />
          Inicio
        </Link>
        {parent && (
          <>
            <span className="pd-back-sep">/</span>
            <Link href={parent.href} className="pd-back">{parent.label}</Link>
          </>
        )}
        <span className="pd-back-sep">/</span>
        <span className="pd-back-tag" aria-current="page">{label}</span>
      </nav>

      {title && (
        <div style={{ padding: '48px 24px 8px', maxWidth: 720, margin: '0 auto' }}>
          {kicker && (
            <span className="kicker" style={{ display: 'block', marginBottom: 14 }}>{kicker}</span>
          )}
          <h1 className="display" style={{ fontSize: 40, margin: '0 0 8px' }}>{title}</h1>
          {intro && (
            <div className="subtitle-connector" style={{ marginTop: 18, marginBottom: 8 }}>
              <p className="edit" style={{ fontSize: 18, lineHeight: 1.5, color: 'var(--ink-soft)', margin: 0 }}>
                {intro}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
