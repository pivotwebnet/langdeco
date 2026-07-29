'use client'

import { useState } from 'react'

const MOCK_INQUIRIES = [
  { id: '1', client: 'María González', email: 'maria@gmail.com', msg: 'Tengo un salón de 28 m² mirando al norte. Busco una butaca para un rincón de lectura.', products: ['Butaca Laurel'], time: '20/05/2026 · 14:32', status: 'pending' as const },
  { id: '2', client: 'Andrés Martínez', email: 'andres.m@icloud.com', msg: 'Me interesa la Mesa Arenisca pero necesito saber si las medidas se adaptan a un comedor de 3×4m.', products: ['Mesa Arenisca'], time: '20/05/2026 · 09:15', status: 'replied' as const },
  { id: '3', client: 'Laura Pérez', email: 'laup@outlook.es', msg: 'Busco algo para un dormitorio pequeño. Presupuesto hasta 3.000€.', products: ['Cabecero Tela', 'Alfombra Anatolia'], time: '19/05/2026 · 18:44', status: 'pending' as const },
  { id: '4', client: 'Carlos Ruiz', email: 'carlos.ruiz@empresa.com', msg: 'Quiero ver las piezas de la selección destacada en persona.', products: [], time: '19/05/2026 · 11:20', status: 'closed' as const },
]

const STATUS_LABEL = { pending: 'Pendiente', replied: 'Respondida', closed: 'Cerrada' }
const STATUS_BADGE = { pending: 'warn', replied: 'ok', closed: 'neutral' }

export default function ClientesAdmin() {
  const [selected, setSelected] = useState<string | null>(null)

  const inquiry = MOCK_INQUIRIES.find((i) => i.id === selected)

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1 className="adm-title">Consultas</h1>
          <p className="adm-eyebrow">{MOCK_INQUIRIES.filter((i) => i.status === 'pending').length} pendientes · {MOCK_INQUIRIES.length} total</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* List */}
        <div className="adm-card">
          {MOCK_INQUIRIES.map((item, i) => (
            <div
              key={item.id}
              onClick={() => setSelected(item.id === selected ? null : item.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 24px',
                borderBottom: i < MOCK_INQUIRIES.length - 1 ? '1px solid var(--adm-border)' : 'none',
                cursor: 'pointer',
                background: selected === item.id ? 'var(--adm-surface-2)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-deep)', display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 15, color: 'var(--ink)' }}>
                {item.client.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="adm-table-name">{item.client}</span>
                  <span className={`adm-badge ${STATUS_BADGE[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-edit)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.msg}
                </p>
                <div className="adm-table-sub">{item.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {inquiry && (
          <div className="adm-card" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 20, margin: 0, color: 'var(--ink)' }}>{inquiry.client}</h2>
                <div className="adm-table-sub" style={{ marginTop: 4 }}>{inquiry.email}</div>
              </div>
              <span className={`adm-badge ${STATUS_BADGE[inquiry.status]}`}>{STATUS_LABEL[inquiry.status]}</span>
            </div>

            <div style={{ background: 'var(--bg-deep)', padding: 20 }}>
              <p className="edit" style={{ fontSize: 16, lineHeight: 1.5, margin: 0, color: 'var(--ink-soft)' }}>&ldquo;{inquiry.msg}&rdquo;</p>
            </div>

            {inquiry.products.length > 0 && (
              <div>
                <div className="mono" style={{ marginBottom: 8 }}>Piezas de interés</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {inquiry.products.map((p) => (
                    <span key={p} className="adm-badge neutral" style={{ fontFamily: 'var(--font-ui)', fontSize: 12, textTransform: 'none' }}>{p}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hola ${inquiry.client.split(' ')[0]}, te escribimos de LasLongDeco. Sobre tu consulta...`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="adm-btn"
                style={{ flex: 1 }}
              >
                Responder por WhatsApp
              </a>
              <a
                href={`mailto:${inquiry.email}`}
                className="adm-btn ghost"
                style={{ flex: 1, textDecoration: 'none' }}
              >
                Responder por email
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
