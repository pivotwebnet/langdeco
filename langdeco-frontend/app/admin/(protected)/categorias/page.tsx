'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BackendCategory, CategoryGroup } from '@/lib/backend-types'
import { useAdminToast } from '@/components/admin/AdminToast'
import { adminApi as api } from '@/lib/admin/api'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { TableSkeletonRows } from '@/components/admin/TableSkeleton'
import { BulkActionBar } from '@/components/admin/BulkActionBar'

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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState<'activate' | 'deactivate' | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const allSelected = categories.length > 0 && categories.every((c) => selectedIds.has(c.id))
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(categories.map((c) => c.id)))
  }

  const onBulkConfirm = async () => {
    const action = bulkConfirm
    setBulkConfirm(null)
    setBulkBusy(true)
    try {
      const path = action === 'activate' ? '/categories/bulk-activate' : '/categories/bulk-deactivate'
      const result = await api<{ updated: number; skipped: string[] }>(path, { method: 'POST', body: JSON.stringify({ ids: [...selectedIds] }) })
      const verb = action === 'activate' ? 'activada' : 'desactivada'
      toast.success(`${result.updated} categoría${result.updated === 1 ? '' : 's'} ${verb}${result.updated === 1 ? '' : 's'}.`)
      setSelectedIds(new Set())
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBulkBusy(false)
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

      {selectedIds.size > 0 && (
        <BulkActionBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())}>
          <button type="button" className="adm-btn ghost sm" disabled={bulkBusy} onClick={() => setBulkConfirm('activate')}>Activar</button>
          <button type="button" className="adm-btn ghost sm" disabled={bulkBusy} onClick={() => setBulkConfirm('deactivate')}>Desactivar</button>
        </BulkActionBar>
      )}

      <div className="adm-card adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Seleccionar todo" />
              </th>
              <th>Id</th>
              <th>Nombre</th>
              <th>Grupo</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <TableSkeletonRows columns={6} />
            )}
            {!loading && categories.map((c) => (
              <tr key={c.id} className={c.active ? '' : 'inactive'}>
                <td>
                  <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} aria-label={`Seleccionar ${c.name}`} />
                </td>
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

      {bulkConfirm && (
        <ConfirmDialog
          title={bulkConfirm === 'activate' ? 'Activar categorías' : 'Desactivar categorías'}
          message={`¿${bulkConfirm === 'activate' ? 'Activar' : 'Desactivar'} ${selectedIds.size} categoría${selectedIds.size === 1 ? '' : 's'} seleccionada${selectedIds.size === 1 ? '' : 's'}?`}
          confirmLabel={bulkConfirm === 'activate' ? 'Activar' : 'Desactivar'}
          danger={bulkConfirm === 'deactivate'}
          onConfirm={onBulkConfirm}
          onCancel={() => setBulkConfirm(null)}
        />
      )}
    </div>
  )
}
