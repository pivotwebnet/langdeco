'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MIN_PASSWORD_LENGTH, isPasswordStrong, PASSWORD_REQUIREMENTS_HINT } from '@/lib/password-policy'

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

    if (!isPasswordStrong(password)) {
      setError(PASSWORD_REQUIREMENTS_HINT)
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
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--adm-bg)', fontFamily: 'var(--font-ui)' }}>
      <form onSubmit={onSubmit} className="adm-card" style={{ padding: '40px 36px', width: 360 }}>
        <Image
          src="/assets/logo.png"
          alt="LasLangDeco"
          width={746}
          height={361}
          style={{ height: 88, width: 'auto', margin: '0 auto 24px', display: 'block' }}
          priority
        />
        <h1 style={{ fontSize: 18, fontWeight: 500, margin: '0 0 8px' }}>Configuración inicial</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 24px' }}>
          Definí la contraseña del panel de administración.
        </p>

        <div className="adm-field" style={{ marginBottom: 16 }}>
          <label className="adm-field-label">Contraseña</label>
          <input
            className="adm-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            autoFocus
            required
            style={{ width: '100%' }}
          />
        </div>

        <div className="adm-field">
          <label className="adm-field-label">Confirmar contraseña</label>
          <input
            className="adm-input"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            required
            style={{ width: '100%' }}
          />
        </div>

        <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '8px 0 0' }}>{PASSWORD_REQUIREMENTS_HINT}</p>

        {error && <div className="adm-alert error" style={{ marginTop: 16 }}>{error}</div>}

        <button type="submit" disabled={loading} className="adm-btn" style={{ width: '100%', marginTop: 20 }}>
          {loading ? 'Guardando...' : 'Crear contraseña'}
        </button>
      </form>
    </div>
  )
}
