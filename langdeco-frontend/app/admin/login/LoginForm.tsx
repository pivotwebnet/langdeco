'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'No se pudo iniciar sesión. Probá de nuevo.')
        return
      }
      // Navegación dura (no router.push) a propósito: el caché de rutas del
      // cliente puede haber guardado el redirect a /admin/login de cuando
      // todavía no había sesión — router.push podría reusar ese resultado
      // viejo en vez de pedir /admin de nuevo ya autenticado.
      window.location.href = '/admin'
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--adm-bg)', fontFamily: 'var(--font-ui)' }}>
      <form onSubmit={onSubmit} className="adm-card" style={{ padding: '40px 36px', width: 340 }}>
        <div style={{ fontFamily: 'var(--font-script)', fontSize: 26, marginBottom: 4 }}>LasLangDeco</div>
        <h1 style={{ fontSize: 18, fontWeight: 500, margin: '0 0 24px' }}>Ingresar al panel</h1>

        <div className="adm-field">
          <label className="adm-field-label">Contraseña</label>
          <input
            className="adm-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            style={{ width: '100%' }}
          />
        </div>

        {error && <div className="adm-alert error" style={{ marginTop: 16 }}>{error}</div>}

        <button type="submit" disabled={loading} className="adm-btn" style={{ width: '100%', marginTop: 20 }}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
