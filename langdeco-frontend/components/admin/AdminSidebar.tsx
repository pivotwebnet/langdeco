'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '◉' },
  { href: '/admin/productos', label: 'Productos', icon: '▤' },
  { href: '/admin/categorias', label: 'Categorías', icon: '◫' },
  { href: '/admin/ventas', label: 'Ventas', icon: '$' },
  { href: '/admin/presupuestos', label: 'Presupuestos', icon: '≡' },
  { href: '/admin/base-datos/clientes', label: 'Clientes', icon: '◈' },
  { href: '/admin/base-datos/proveedores', label: 'Proveedores', icon: '◇' },
  { href: '/admin/clientes', label: 'Consultas', icon: '◎' },
  { href: '/admin/configuracion', label: 'Configuración', icon: '⚙' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: 'var(--ink)', color: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '32px 0',
      position: 'sticky', top: 0, height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 28px 32px', borderBottom: '1px solid rgba(242,241,237,0.1)' }}>
        <div style={{ fontFamily: 'var(--font-script)', fontSize: 24, color: 'var(--bg)', lineHeight: 1 }}>
          LasLongDeco
        </div>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(242,241,237,0.4)', marginTop: 4 }}>
          Admin
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '24px 0' }}>
        {NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 28px',
                fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: active ? 500 : 400,
                color: active ? 'var(--bg)' : 'rgba(242,241,237,0.55)',
                textDecoration: 'none',
                background: active ? 'rgba(242,241,237,0.08)' : 'transparent',
                borderLeft: active ? '2px solid var(--bg)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 14, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '20px 28px', borderTop: '1px solid rgba(242,241,237,0.1)' }}>
        <Link
          href="/"
          style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(242,241,237,0.4)', textDecoration: 'none' }}
        >
          ← Ver showroom
        </Link>
      </div>
    </aside>
  )
}
