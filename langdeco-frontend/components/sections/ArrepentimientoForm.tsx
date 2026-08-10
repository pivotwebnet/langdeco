'use client'

import { useState } from 'react'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'

export function ArrepentimientoForm() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [referencia, setReferencia] = useState('')
  const [motivo, setMotivo] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      const message = `[SOLICITUD DE ARREPENTIMIENTO]\nReferencia de pedido: ${referencia || '-'}\nMotivo: ${motivo}`
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: nombre, email, message }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'No se pudo enviar la solicitud')

      setSent(true)
      setNombre('')
      setEmail('')
      setReferencia('')
      setMotivo('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section data-dt="arrepentimiento-form" style={{ position: 'relative', maxWidth: 560 }}>
      {sent ? (
        <RevealOnScroll>
          <div className="adm-alert" style={{ border: '1px solid var(--line)', padding: '20px 24px', background: 'var(--bg-deep)' }}>
            Recibimos tu solicitud de arrepentimiento — te vamos a contactar por mail para coordinar la devolución.
          </div>
        </RevealOnScroll>
      ) : (
        <RevealOnScroll>
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{ color: 'var(--ink)', background: '#f3d9d9', padding: '10px 14px', fontSize: 13 }}>{error}</div>
            )}

            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre"
              required
              maxLength={200}
              style={inputStyle}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo"
              required
              maxLength={200}
              style={inputStyle}
            />
            <input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Referencia de pedido (opcional)"
              maxLength={200}
              style={inputStyle}
            />
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Contanos qué pieza querés devolver y por qué"
              required
              maxLength={2000}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit' }}
            />

            <button className="btn" type="submit" disabled={sending} style={{ alignSelf: 'flex-start' }}>
              {sending ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </form>
        </RevealOnScroll>
      )}
    </section>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--ink)',
  fontSize: 15,
  outline: 'none',
}
