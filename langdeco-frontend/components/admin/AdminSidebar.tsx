'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdminToast } from '@/components/admin/AdminToast'

const NAV = [
  { group: 'General', items: [
    { href: '/admin', label: 'Dashboard', icon: '◉' },
    { href: '/admin/ventas', label: 'Ventas', icon: '$' },
    { href: '/admin/presupuestos', label: 'Presupuestos', icon: '≡' },
  ] },
  { group: 'Catálogo', items: [
    { href: '/admin/productos', label: 'Productos', icon: '▤' },
    { href: '/admin/categorias', label: 'Categorías', icon: '◫' },
  ] },
  { group: 'Contactos', items: [
    { href: '/admin/base-datos/clientes', label: 'Clientes', icon: '◈' },
    { href: '/admin/base-datos/proveedores', label: 'Proveedores', icon: '◇' },
    { href: '/admin/clientes', label: 'Consultas', icon: '◎' },
  ] },
  { group: 'Sitio', items: [
    { href: '/admin/contenido', label: 'Contenido del sitio', icon: '❖' },
    { href: '/admin/configuracion', label: 'Configuración', icon: '⚙' },
  ] },
]

const PENDING_POLL_MS = 45000

/* ── Consultas pendientes: pollea en segundo plano mientras el panel esté
   abierto y avisa con un toast apenas detecta una consulta nueva. No sustituye
   un aviso por email/WhatsApp fuera del panel — eso necesitaría un servicio
   externo con credenciales que hoy no están configuradas. */
function usePendingInquiries() {
  const toast = useAdminToast()
  const [pending, setPending] = useState(0)
  const prevPending = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch('/api/admin/backend/inquiries')
        if (!res.ok) return
        const data: { status: string }[] = await res.json()
        if (cancelled) return
        const count = data.filter((i) => i.status === 'Pending').length
        if (prevPending.current !== null && count > prevPending.current) {
          toast.success(count - prevPending.current === 1 ? 'Llegó una consulta nueva.' : `Llegaron ${count - prevPending.current} consultas nuevas.`)
        }
        prevPending.current = count
        setPending(count)
      } catch { /* ignore */ }
    }

    poll()
    const interval = setInterval(poll, PENDING_POLL_MS)
    return () => { cancelled = true; clearInterval(interval) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return pending
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pendingInquiries = usePendingInquiries()

  useEffect(() => {
    const stored = window.localStorage.getItem('adm-sidebar-collapsed')
    if (stored === '1') setCollapsed(true)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('adm-sidebar-collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <>
      {/* Mobile topbar */}
      <div className="adm-topbar">
        <button className="adm-topbar-btn" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
          ☰
        </button>
        <span className="script">LasLangDeco</span>
      </div>

      <div className={`adm-sidebar-backdrop${mobileOpen ? ' show' : ''}`} onClick={() => setMobileOpen(false)} />

      <aside className={`adm-sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="adm-sidebar-head">
          <div className="adm-sidebar-brand">
            <div className="script">LasLangDeco</div>
            <div className="tag">Admin</div>
          </div>
          <button
            className="adm-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            ‹
          </button>
        </div>

        <nav className="adm-nav">
          {NAV.map((section) => (
            <div key={section.group}>
              <div className="adm-nav-group-label">{section.group}</div>
              {section.items.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`adm-nav-link${active ? ' active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="ic">{item.icon}</span>
                    <span className="label">{item.label}</span>
                    {item.href === '/admin/clientes' && pendingInquiries > 0 && (
                      <span className="adm-badge warn" style={{ marginLeft: 'auto' }}>{pendingInquiries}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="adm-sidebar-foot">
          <Link href="/">
            <span>←</span>
            <span className="txt">Ver showroom</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
