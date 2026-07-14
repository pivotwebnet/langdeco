'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfiguracionAdmin() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword !== confirm) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo cambiar la contraseña')
        return
      }
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
    } finally {
      setSaving(false)
    }
  }

  const onLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 32, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)' }}>
          Configuración
        </h1>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--line)', padding: '28px 32px', maxWidth: 420, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 20px' }}>Cambiar contraseña</h2>

        <form onSubmit={onSubmit}>
          <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-mute)', marginBottom: 6 }}>Contraseña actual</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', marginBottom: 16, fontSize: 14 }} />

          <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-mute)', marginBottom: 6 }}>Nueva contraseña</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', marginBottom: 16, fontSize: 14 }} />

          <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-mute)', marginBottom: 6 }}>Confirmar nueva contraseña</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', marginBottom: 20, fontSize: 14 }} />

          {error && <p style={{ color: '#B91C1C', fontSize: 13, marginBottom: 16 }}>{error}</p>}
          {success && <p style={{ color: '#065F46', fontSize: 13, marginBottom: 16 }}>Contraseña actualizada.</p>}

          <button type="submit" disabled={saving} className="btn" style={{ width: '100%', justifyContent: 'center' }}>
            {saving ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>

      <button onClick={onLogout} className="btn ghost" style={{ fontSize: 12 }}>Cerrar sesión</button>
    </div>
  )
}
