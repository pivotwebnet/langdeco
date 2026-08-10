import Link from 'next/link'
import * as Icon from '@/components/ui/Icon'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  /** Current page name shown in the breadcrumb tag, e.g. "Catálogo" */
  label: string
  kicker?: string
  title?: ReactNode
  intro?: ReactNode
}

export function PageHeader({ label, kicker, title, intro }: PageHeaderProps) {
  return (
    <>
      <div className="pd-breadcrumb">
        <Link href="/" className="pd-back">
          <Icon.Arrow style={{ transform: 'rotate(180deg)' }} />
          Inicio
        </Link>
        <span className="pd-back-sep">/</span>
        <span className="pd-back-tag">{label}</span>
      </div>

      {title && (
        <div style={{ padding: '48px 24px 8px' }}>
          {kicker && (
            <span className="kicker" style={{ display: 'block', marginBottom: 14 }}>{kicker}</span>
          )}
          <h1 className="display" style={{ fontSize: 40, margin: '0 0 8px', maxWidth: 640 }}>{title}</h1>
          {intro && (
            <div className="subtitle-connector" style={{ marginTop: 18, marginBottom: 8 }}>
              <p className="edit" style={{ fontSize: 18, lineHeight: 1.5, maxWidth: 560, color: 'var(--ink-soft)', margin: 0 }}>
                {intro}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
