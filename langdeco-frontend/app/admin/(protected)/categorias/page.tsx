'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BackendCategory } from '@/lib/backend-types'
import { useAdminToast } from '@/components/admin/AdminToast'

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
  const toast = useAdminToast()
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
      toast.success('Categoría creada.')
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    }
  }

  const startEdit = (c: BackendCategory) => { setEditingId(c.id); setEditingName(c.name) }

  const onSaveEdit = async () => {
    if (!editingId) return
    setError(null)
    try {
      await api(`/categories/${editingId}`, { method: 'PUT', body: JSON.stringify({ id: editingId, name: editingName }) })
      setEditingId(null)
      toast.success('Categoría actualizada.')
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    }
  }

  const onDelete = async (c: BackendCategory) => {
    if (!confirm(`¿Eliminar la categoría "${c.name}"?`)) return
    setError(null)
    try {
      await api(`/categories/${c.id}`, { method: 'DELETE' })
      toast.success('Categoría eliminada.')
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    }
  }

  const onActivate = async (c: BackendCategory) => {
    setError(null)
    try {
      await api(`/categories/${c.id}/activate`, { method: 'POST' })
      toast.success('Categoría reactivada.')
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1 className="adm-title">Categorías</h1>
          <p className="adm-eyebrow">{categories.length} categorías</p>
        </div>
      </div>

      {error && <div className="adm-alert error">{error}</div>}

      <form onSubmit={onCreate} className="adm-toolbar">
        <input className="adm-input" value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="id-slug" required style={{ width: 160 }} />
        <input className="adm-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre visible" required style={{ flex: 1, maxWidth: 320 }} />
        <button className="adm-btn" type="submit">+ Añadir categoría</button>
      </form>

      <div className="adm-card adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4}><div className="adm-loading">Cargando…</div></td></tr>
            )}
            {!loading && categories.map((c) => (
              <tr key={c.id} className={c.active ? '' : 'inactive'}>
                <td className="mono">{c.id}</td>
                <td>
                  {editingId === c.id ? (
                    <input className="adm-input" value={editingName} onChange={(e) => setEditingName(e.target.value)} style={{ width: '100%' }} />
                  ) : (
                    <span className="adm-table-name">{c.name}</span>
                  )}
                </td>
                <td><span className={`adm-badge ${c.active ? 'ok' : 'danger'}`}>{c.active ? 'Activa' : 'Inactiva'}</span></td>
                <td>
                  <div className="adm-table-actions">
                    {editingId === c.id ? (
                      <>
                        <button className="adm-link-btn" onClick={onSaveEdit}>Guardar</button>
                        <button className="adm-link-btn" onClick={() => setEditingId(null)}>Cancelar</button>
                      </>
                    ) : (
                      <button className="adm-link-btn" onClick={() => startEdit(c)}>Editar</button>
                    )}
                    {c.active ? (
                      <button className="adm-link-btn danger" onClick={() => onDelete(c)}>Eliminar</button>
                    ) : (
                      <button className="adm-link-btn success" onClick={() => onActivate(c)}>Reactivar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && categories.length === 0 && <div className="adm-empty">Sin categorías.</div>}
      </div>
    </div>
  )
}
