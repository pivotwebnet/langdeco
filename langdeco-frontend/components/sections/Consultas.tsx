'use client'

import { useState } from 'react'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { Underline } from '@/components/ui/Underline'

export function Consultas() {
  const [clientName, setClientName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, email, message }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'No se pudo enviar la consulta')

      setSent(true)
      setClientName('')
      setEmail('')
      setMessage('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section data-dt="consultas" style={{ position: 'relative' }}>
      <RevealOnScroll>
        <span className="kicker" style={{ display: 'block', marginBottom: 14 }}>¿Tenés una consulta?</span>
        <h2 className="display" style={{ fontSize: 32, margin: '0 0 12px' }}>
          Escribinos, <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}><Underline>te respondemos</Underline></em>.
        </h2>
      </RevealOnScroll>
      <div className="subtitle-connector" data-reveal="up" data-delay="0.15" style={{ marginBottom: 32 }}>
        <p className="edit" style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--ink-soft)', margin: 0, maxWidth: 460 }}>
          Contanos qué estás buscando y te contestamos por mail.
        </p>
      </div>

      {sent ? (
        <RevealOnScroll>
          <div className="adm-alert" style={{ border: '1px solid var(--line)', padding: '20px 24px', background: 'var(--bg-deep)' }}>
            Gracias — recibimos tu consulta y te vamos a responder pronto.
          </div>
        </RevealOnScroll>
      ) : (
        <RevealOnScroll delay={1}>
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{ color: 'var(--ink)', background: '#f3d9d9', padding: '10px 14px', fontSize: 13 }}>{error}</div>
            )}

            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
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
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Contanos tu consulta"
              required
              maxLength={2000}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit' }}
            />

            <button className="btn" type="submit" disabled={sending} style={{ alignSelf: 'flex-start' }}>
              {sending ? 'Enviando...' : 'Enviar consulta'}
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
