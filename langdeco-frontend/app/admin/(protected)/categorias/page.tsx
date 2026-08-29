'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BackendCategory, CategoryGroup } from '@/lib/backend-types'
import { useAdminToast } from '@/components/admin/AdminToast'
import { adminApi as api } from '@/lib/admin/api'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { TableSkeletonRows } from '@/components/admin/TableSkeleton'

const GROUP_LABEL: Record<CategoryGroup, string> = { Mayor: 'Piezas Mayores', Tesoro: 'Pequeños Tesoros' }

export default function CategoriasAdmin() {
  const toast = useAdminToast()
  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newId, setNewId] = useState('')
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState<CategoryGroup>('Mayor')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingGroup, setEditingGroup] = useState<CategoryGroup>('Mayor')

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
    setSaving(true)
    try {
      await api('/categories', { method: 'POST', body: JSON.stringify({ id: newId, name: newName, group: newGroup }) })
      setNewId('')
      setNewName('')
      setNewGroup('Mayor')
      toast.success('Categoría creada.')
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (c: BackendCategory) => { setEditingId(c.id); setEditingName(c.name); setEditingGroup(c.group) }

  const onSaveEdit = async () => {
    if (!editingId) return
    setError(null)
    setSaving(true)
    try {
      await api(`/categories/${editingId}`, { method: 'PUT', body: JSON.stringify({ id: editingId, name: editingName, group: editingGroup }) })
      setEditingId(null)
      toast.success('Categoría actualizada.')
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const [confirmDelete, setConfirmDelete] = useState<BackendCategory | null>(null)

  const onDelete = async (c: BackendCategory) => {
    setConfirmDelete(null)
    setError(null)
    try {
      await api(`/categories/${c.id}`, { method: 'DELETE' })
      toast.success('Categoría eliminada o desactivada.')
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
        <select className="adm-select" value={newGroup} onChange={(e) => setNewGroup(e.target.value as CategoryGroup)}>
          <option value="Mayor">Piezas Mayores</option>
          <option value="Tesoro">Pequeños Tesoros</option>
        </select>
        <button className="adm-btn" type="submit" disabled={saving}>{saving ? 'Guardando…' : '+ Añadir categoría'}</button>
      </form>

      <div className="adm-card adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Nombre</th>
              <th>Grupo</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <TableSkeletonRows columns={5} />
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
                <td>
                  {editingId === c.id ? (
                    <select className="adm-select" value={editingGroup} onChange={(e) => setEditingGroup(e.target.value as CategoryGroup)}>
                      <option value="Mayor">Piezas Mayores</option>
                      <option value="Tesoro">Pequeños Tesoros</option>
                    </select>
                  ) : (
                    <span className="adm-table-sub">{GROUP_LABEL[c.group]}</span>
                  )}
                </td>
                <td><span className={`adm-badge ${c.active ? 'ok' : 'danger'}`}>{c.active ? 'Activa' : 'Inactiva'}</span></td>
                <td>
                  <div className="adm-table-actions">
                    {editingId === c.id ? (
                      <>
                        <button className="adm-link-btn" onClick={onSaveEdit} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
                        <button className="adm-link-btn" onClick={() => setEditingId(null)} disabled={saving}>Cancelar</button>
                      </>
                    ) : (
                      <button className="adm-link-btn" onClick={() => startEdit(c)}>Editar</button>
                    )}
                    {c.active ? (
                      <button className="adm-link-btn danger" onClick={() => setConfirmDelete(c)}>Eliminar</button>
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

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar categoría"
          message={`¿Eliminar la categoría "${confirmDelete.name}"? Si tiene productos asociados, se desactiva en vez de borrarse.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={() => onDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
