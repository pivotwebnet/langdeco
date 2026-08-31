'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminToast } from '@/components/admin/AdminToast'
import { Field } from '@/components/admin/Field'
import { adminApi as api } from '@/lib/admin/api'
import { MIN_PASSWORD_LENGTH, isPasswordStrong, PASSWORD_REQUIREMENTS_HINT } from '@/lib/password-policy'

function CompanySettingsCard() {
  const toast = useAdminToast()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api<{ phone: string | null }>('/company-settings')
      .then((data) => setPhone(data.phone || ''))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/company-settings', { method: 'PUT', body: JSON.stringify({ phone: phone || null }) })
      toast.success('Teléfono actualizado.')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="adm-card" style={{ padding: '28px 32px', maxWidth: 420, marginBottom: 24 }}>
      <h2 className="adm-card-title" style={{ marginBottom: 20 }}>Datos de la empresa</h2>
      <form onSubmit={onSubmit}>
        <Field label="Teléfono (aparece en los comprobantes PDF)" style={{ marginBottom: 16 }}>
          <input className="adm-input" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading} style={{ width: '100%' }} />
        </Field>
        <button type="submit" disabled={saving || loading} className="adm-btn" style={{ width: '100%' }}>
          {saving ? 'Guardando...' : 'Guardar teléfono'}
        </button>
      </form>
    </div>
  )
}

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

    if (!isPasswordStrong(newPassword)) {
      setError(PASSWORD_REQUIREMENTS_HINT)
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

      <CompanySettingsCard />

      <div className="adm-card" style={{ padding: '28px 32px', maxWidth: 420, marginBottom: 24 }}>
        <h2 className="adm-card-title" style={{ marginBottom: 20 }}>Cambiar contraseña</h2>

        <form onSubmit={onSubmit}>
          <Field label="Contraseña actual" style={{ marginBottom: 16 }}>
            <input className="adm-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required style={{ width: '100%' }} />
          </Field>

          <Field label="Nueva contraseña" style={{ marginBottom: 4 }}>
            <input className="adm-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={MIN_PASSWORD_LENGTH} style={{ width: '100%' }} />
          </Field>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '0 0 16px' }}>{PASSWORD_REQUIREMENTS_HINT}</p>

          <Field label="Confirmar nueva contraseña" style={{ marginBottom: 16 }}>
            <input className="adm-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={MIN_PASSWORD_LENGTH} style={{ width: '100%' }} />
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

