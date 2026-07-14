'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BackendCategory } from '@/lib/backend-types'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/backend${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
  return data as T
}

export default function CategoriasAdmin() {
  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newId, setNewId] = useState('')
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCategories(await api<BackendCategory[]>('/categories?includeInactive=true'))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await api('/categories', { method: 'POST', body: JSON.stringify({ id: newId, name: newName }) })
      setNewId('')
      setNewName('')
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const startEdit = (c: BackendCategory) => { setEditingId(c.id); setEditingName(c.name) }

  const onSaveEdit = async () => {
    if (!editingId) return
    setError(null)
    try {
      await api(`/categories/${editingId}`, { method: 'PUT', body: JSON.stringify({ id: editingId, name: editingName }) })
      setEditingId(null)
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const onDelete = async (c: BackendCategory) => {
    if (!confirm(`¿Eliminar la categoría "${c.name}"?`)) return
    setError(null)
    try {
      await api(`/categories/${c.id}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const onActivate = async (c: BackendCategory) => {
    setError(null)
    try {
      await api(`/categories/${c.id}/activate`, { method: 'POST' })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 32, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)' }}>
          Categorías
        </h1>
        <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginTop: 6 }}>
          {categories.length} categorías
        </p>
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>{error}</div>}

      <form onSubmit={onCreate} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="id-slug" required
          style={{ padding: '10px 14px', border: '1px solid var(--line)', fontSize: 13, width: 160 }} />
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre visible" required
          style={{ padding: '10px 14px', border: '1px solid var(--line)', fontSize: 13, flex: 1 }} />
        <button className="btn" type="submit" style={{ fontSize: 11 }}>+ Añadir categoría</button>
      </form>

      <div style={{ background: 'white', border: '1px solid var(--line)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 140px', padding: '12px 24px', borderBottom: '1px solid var(--line)', background: '#F8F7F4' }}>
          {['Id', 'Nombre', 'Estado', ''].map((h) => (
            <span key={h} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>{h}</span>
          ))}
        </div>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-mute)' }}>Cargando...</div>}
        {!loading && categories.map((c, i) => (
          <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 140px', padding: '14px 24px', borderBottom: i < categories.length - 1 ? '1px solid var(--line)' : 'none', alignItems: 'center', opacity: c.active ? 1 : 0.5 }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{c.id}</div>
            <div>
              {editingId === c.id ? (
                <input value={editingName} onChange={(e) => setEditingName(e.target.value)} style={{ padding: '6px 10px', border: '1px solid var(--line)', fontSize: 13, width: '100%' }} />
              ) : (
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14 }}>{c.name}</span>
              )}
            </div>
            <span className="mono" style={{ fontSize: 9, color: c.active ? '#065F46' : '#991B1B' }}>{c.active ? 'Activa' : 'Inactiva'}</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {editingId === c.id ? (
                <>
                  <button onClick={onSaveEdit} style={linkBtn}>Guardar</button>
                  <button onClick={() => setEditingId(null)} style={linkBtn}>Cancelar</button>
                </>
              ) : (
                <button onClick={() => startEdit(c)} style={linkBtn}>Editar</button>
              )}
              {c.active ? (
                <button onClick={() => onDelete(c)} style={{ ...linkBtn, color: '#991B1B' }}>Eliminar</button>
              ) : (
                <button onClick={() => onActivate(c)} style={{ ...linkBtn, color: '#065F46' }}>Reactivar</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const linkBtn: React.CSSProperties = {
  background: 'none', border: 0, cursor: 'pointer', fontFamily: 'ui-monospace, monospace',
  fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', padding: 0,
}
