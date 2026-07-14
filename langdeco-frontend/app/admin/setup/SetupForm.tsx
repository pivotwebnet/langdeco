'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo configurar la contraseña')
        return
      }
      router.push('/admin')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F8F7F4', fontFamily: 'var(--font-ui)' }}>
      <form onSubmit={onSubmit} style={{ background: 'white', border: '1px solid var(--line)', padding: '40px 36px', width: 360 }}>
        <div style={{ fontFamily: 'var(--font-script)', fontSize: 26, marginBottom: 4 }}>LasLongDeco</div>
        <h1 style={{ fontSize: 18, fontWeight: 500, margin: '0 0 8px' }}>Configuración inicial</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 24px' }}>
          Definí la contraseña del panel de administración.
        </p>

        <label style={{ display: 'block', fontSize: 11, marginBottom: 6, color: 'var(--ink-mute)' }}>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', marginBottom: 16, fontSize: 14 }}
        />

        <label style={{ display: 'block', fontSize: 11, marginBottom: 6, color: 'var(--ink-mute)' }}>Confirmar contraseña</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={8}
          required
          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', marginBottom: 20, fontSize: 14 }}
        />

        {error && <p style={{ color: '#B91C1C', fontSize: 13, marginBottom: 16 }}>{error}</p>}

        <button type="submit" disabled={loading} className="btn" style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? 'Guardando...' : 'Crear contraseña'}
        </button>
      </form>
    </div>
  )
}
