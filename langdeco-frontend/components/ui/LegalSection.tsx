import type { ReactNode } from 'react'

interface LegalSectionProps {
  title: string
  children: ReactNode
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20, marginTop: 32 }}>
      <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: 20, fontWeight: 500, margin: '0 0 12px', color: 'var(--ink)' }}>
        {title}
      </h2>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 15, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
        {children}
      </div>
    </div>
  )
}
