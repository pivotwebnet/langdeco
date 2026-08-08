'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminToast } from '@/components/admin/AdminToast'

export default function ConfiguracionAdmin() {
  const toast = useAdminToast()
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
        const msg = data.error || 'No se pudo cambiar la contraseña'
        setError(msg)
        toast.error(msg)
        return
      }
      setSuccess(true)
      toast.success('Contraseña actualizada.')
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
      <div className="adm-page-head">
        <div>
          <h1 className="adm-title">Configuración</h1>
        </div>
      </div>

      <div className="adm-card" style={{ padding: '28px 32px', maxWidth: 420, marginBottom: 24 }}>
        <h2 className="adm-card-title" style={{ marginBottom: 20 }}>Cambiar contraseña</h2>

        <form onSubmit={onSubmit}>
          <Field label="Contraseña actual">
            <input className="adm-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required style={{ width: '100%' }} />
          </Field>

          <Field label="Nueva contraseña">
            <input className="adm-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} style={{ width: '100%' }} />
          </Field>

          <Field label="Confirmar nueva contraseña">
            <input className="adm-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} style={{ width: '100%' }} />
          </Field>

          {error && <div className="adm-alert error">{error}</div>}
          {success && <div className="adm-alert success">Contraseña actualizada.</div>}

          <button type="submit" disabled={saving} className="adm-btn" style={{ width: '100%', marginTop: 4 }}>
            {saving ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>

      <button onClick={onLogout} className="adm-btn ghost">Cerrar sesión</button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="adm-field" style={{ marginBottom: 16 }}>
      <label className="adm-field-label">{label}</label>
      {children}
    </div>
  )
}
