'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BackendInquiry, InquiryStatus } from '@/lib/backend-types'
import { useAdminToast } from '@/components/admin/AdminToast'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/backend${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
  return data as T
}

const STATUS_LABEL: Record<InquiryStatus, string> = { Pending: 'Pendiente', Replied: 'Respondida', Closed: 'Cerrada' }
const STATUS_BADGE: Record<InquiryStatus, string> = { Pending: 'warn', Replied: 'ok', Closed: 'neutral' }

export default function ClientesAdmin() {
  const toast = useAdminToast()
  const [inquiries, setInquiries] = useState<BackendInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setInquiries(await api<BackendInquiry[]>('/inquiries'))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const inquiry = inquiries.find((i) => i.id === selected)

  const changeStatus = async (id: number, status: InquiryStatus) => {
    setError(null)
    try {
      await api(`/inquiries/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      toast.success(`Consulta marcada como ${STATUS_LABEL[status].toLowerCase()}.`)
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1 className="adm-title">Consultas</h1>
          <p className="adm-eyebrow">{inquiries.filter((i) => i.status === 'Pending').length} pendientes · {inquiries.length} total</p>
        </div>
      </div>

      {error && <div className="adm-alert error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* List */}
        <div className="adm-card">
          {loading && <div className="adm-loading">Cargando…</div>}
          {!loading && inquiries.length === 0 && <div className="adm-empty">Sin consultas todavía.</div>}
          {!loading && inquiries.map((item, i) => (
            <div
              key={item.id}
              onClick={() => setSelected(item.id === selected ? null : item.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 24px',
                borderBottom: i < inquiries.length - 1 ? '1px solid var(--adm-border)' : 'none',
                cursor: 'pointer',
                background: selected === item.id ? 'var(--adm-surface-2)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-deep)', display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 15, color: 'var(--ink)' }}>
                {item.clientName.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="adm-table-name">{item.clientName}</span>
                  <span className={`adm-badge ${STATUS_BADGE[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-edit)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.message}
                </p>
                <div className="adm-table-sub">{new Date(item.createdAt).toLocaleString('es-AR')}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {inquiry && (
          <div className="adm-card" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 20, margin: 0, color: 'var(--ink)' }}>{inquiry.clientName}</h2>
                <div className="adm-table-sub" style={{ marginTop: 4 }}>{inquiry.email}</div>
              </div>
              <span className={`adm-badge ${STATUS_BADGE[inquiry.status]}`}>{STATUS_LABEL[inquiry.status]}</span>
            </div>

            <div style={{ background: 'var(--bg-deep)', padding: 20 }}>
              <p className="edit" style={{ fontSize: 16, lineHeight: 1.5, margin: 0, color: 'var(--ink-soft)' }}>&ldquo;{inquiry.message}&rdquo;</p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <a
                href={`mailto:${inquiry.email}`}
                className="adm-btn"
                style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
              >
                Responder por email
              </a>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
              {inquiry.status !== 'Replied' && (
                <button className="adm-btn ghost" style={{ flex: 1 }} onClick={() => changeStatus(inquiry.id, 'Replied')}>
                  Marcar respondida
                </button>
              )}
              {inquiry.status !== 'Closed' && (
                <button className="adm-btn ghost" style={{ flex: 1 }} onClick={() => changeStatus(inquiry.id, 'Closed')}>
                  Cerrar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
