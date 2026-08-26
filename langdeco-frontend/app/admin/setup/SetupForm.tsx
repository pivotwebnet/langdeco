'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MIN_PASSWORD_LENGTH, checkPassword, isPasswordStrong, PASSWORD_REQUIREMENTS_HINT } from '@/lib/password-policy'

const STRENGTH_COLORS = { red: '#dc2626', yellow: '#d97706', green: '#16a34a' } as const

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const { length, hasLetter, hasNumber } = checkPassword(password)
  const metCount = Number(length) + Number(hasLetter) + Number(hasNumber)
  const level = metCount === 3 ? 'green' : metCount === 0 ? 'red' : 'yellow'
  const color = STRENGTH_COLORS[level]

  const missing: string[] = []
  if (!length) missing.push(`al menos ${MIN_PASSWORD_LENGTH} caracteres`)
  if (!hasLetter) missing.push('una letra')
  if (!hasNumber) missing.push('un número')

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: 4,
              flex: 1,
              borderRadius: 2,
              background: i < metCount ? color : '#e5e7eb',
              transition: 'background-color 0.15s',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 12, margin: '6px 0 0', color, fontWeight: 500 }}>
        {level === 'green' ? '✓ Contraseña segura' : `Falta: ${missing.join(', ')}`}
      </p>
    </div>
  )
}

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
          <PasswordStrength password={password} />
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
