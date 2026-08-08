'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { BackendSupplier, DefaultReceiptType, IvaCondition } from '@/lib/backend-types'
import { isValidCuit } from '@/lib/cuit'
import { IVA_CONDITION_LABEL, RECEIPT_TYPE_LABEL } from '@/lib/party-labels'
import { useEscapeKey } from '@/lib/useEscapeKey'
import { useAdminToast } from '@/components/admin/AdminToast'

type ContactPersonForm = { name: string; role: string; cell: string; phone: string; email: string }
type CustomFieldForm = { label: string; value: string }

type SupplierForm = {
  id: number | null
  companyOrFullName: string
  firstName: string
  lastName: string
  cell: string
  phone: string
  email: string
  webPage: string
  address: string
  province: string
  postalCode: string
  locality: string
  note: string
  initialBalance: string
  purchasesCategory: string
  purchasesDiscountPercent: string
  noteInternal: string
  billingCompanyOrFullName: string
  taxId: string
  ivaCondition: IvaCondition
  defaultReceiptType: DefaultReceiptType
  billingPhone: string
  billingCell: string
  fiscalAddress: string
  fiscalLocality: string
  fiscalProvince: string
  fiscalPostalCode: string
  contactPersons: ContactPersonForm[]
  customFields: CustomFieldForm[]
}

const EMPTY_FORM: SupplierForm = {
  id: null, companyOrFullName: '', firstName: '', lastName: '', cell: '', phone: '', email: '', webPage: '',
  address: '', province: '', postalCode: '', locality: '', note: '', initialBalance: '0',
  purchasesCategory: '', purchasesDiscountPercent: '0', noteInternal: '',
  billingCompanyOrFullName: '', taxId: '', ivaCondition: 'ConsumidorFinal', defaultReceiptType: 'FacturaB',
  billingPhone: '', billingCell: '', fiscalAddress: '', fiscalLocality: '', fiscalProvince: '', fiscalPostalCode: '',
  contactPersons: [], customFields: [],
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/backend${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
  return data as T
}

export default function ProveedoresAdmin() {
  const toast = useAdminToast()
  const [suppliers, setSuppliers] = useState<BackendSupplier[]>([])
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<SupplierForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams()
      if (showInactive) qs.set('includeInactive', 'true')
      if (search) qs.set('search', search)
      setSuppliers(await api<BackendSupplier[]>(`/suppliers?${qs}`))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [search, showInactive])

  useEffect(() => { load() }, [load])

  const openCreate = () => setForm({ ...EMPTY_FORM })

  const openEdit = (s: BackendSupplier) => setForm({
    id: s.id, companyOrFullName: s.companyOrFullName, firstName: s.firstName || '', lastName: s.lastName || '',
    cell: s.cell || '', phone: s.phone || '', email: s.email || '', webPage: s.webPage || '',
    address: s.address || '', province: s.province || '', postalCode: s.postalCode || '', locality: s.locality || '',
    note: s.note || '', initialBalance: String(s.initialBalance),
    purchasesCategory: s.purchasesCategory || '', purchasesDiscountPercent: String(s.purchasesDiscountPercent),
    noteInternal: s.noteInternal || '',
    billingCompanyOrFullName: s.billingCompanyOrFullName, taxId: s.taxId || '',
    ivaCondition: s.ivaCondition, defaultReceiptType: s.defaultReceiptType,
    billingPhone: s.billingPhone || '', billingCell: s.billingCell || '',
    fiscalAddress: s.fiscalAddress || '', fiscalLocality: s.fiscalLocality || '',
    fiscalProvince: s.fiscalProvince || '', fiscalPostalCode: s.fiscalPostalCode || '',
    contactPersons: s.contactPersons.map((cp) => ({ name: cp.name, role: cp.role || '', cell: cp.cell || '', phone: cp.phone || '', email: cp.email || '' })),
    customFields: s.customFields.map((cf) => ({ ...cf })),
  })

  const onSave = async () => {
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        companyOrFullName: form.companyOrFullName, firstName: form.firstName || null, lastName: form.lastName || null,
        cell: form.cell || null, phone: form.phone || null, email: form.email || null, webPage: form.webPage || null,
        address: form.address || null, province: form.province || null, postalCode: form.postalCode || null,
        locality: form.locality || null, note: form.note || null, initialBalance: Number(form.initialBalance) || 0,
        purchasesCategory: form.purchasesCategory || null,
        purchasesDiscountPercent: Number(form.purchasesDiscountPercent) || 0, noteInternal: form.noteInternal || null,
        billingCompanyOrFullName: form.billingCompanyOrFullName || form.companyOrFullName, taxId: form.taxId || null,
        ivaCondition: form.ivaCondition, defaultReceiptType: form.defaultReceiptType,
        billingPhone: form.billingPhone || null, billingCell: form.billingCell || null,
        fiscalAddress: form.fiscalAddress || null, fiscalLocality: form.fiscalLocality || null,
        fiscalProvince: form.fiscalProvince || null, fiscalPostalCode: form.fiscalPostalCode || null,
        contactPersons: form.contactPersons.filter((cp) => cp.name.trim()).map((cp) => ({ name: cp.name, role: cp.role || null, cell: cp.cell || null, phone: cp.phone || null, email: cp.email || null })),
        customFields: form.customFields.filter((cf) => cf.label.trim()),
      }

      if (form.id) {
        await api(`/suppliers/${form.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        toast.success('Proveedor actualizado.')
      } else {
        await api(`/suppliers`, { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Proveedor creado.')
      }

      setForm(null)
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (s: BackendSupplier) => {
    if (!confirm(`¿Eliminar "${s.companyOrFullName}"?`)) return
    try {
      await api(`/suppliers/${s.id}`, { method: 'DELETE' })
      toast.success('Proveedor eliminado.')
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    }
  }

  const onActivate = async (s: BackendSupplier) => {
    try {
      await api(`/suppliers/${s.id}/activate`, { method: 'POST' })
      toast.success('Proveedor reactivado.')
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    }
  }

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setImportMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/backend/suppliers/import', { method: 'POST', body: formData })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
      const msg = `Importación completa: ${data.created} creados, ${data.updated} actualizados${data.errors?.length ? `, ${data.errors.length} con error` : ''}.`
      setImportMsg(msg)
      toast.success(msg)
      await load()
    } catch (err) {
      const msg = (err as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1 className="adm-title">Proveedores</h1>
          <p className="adm-eyebrow">{suppliers.length} proveedores</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="adm-btn ghost" href="/api/admin/backend/suppliers/export" download="proveedores.xlsx">Exportar Excel</a>
          <button className="adm-btn ghost" onClick={() => fileInputRef.current?.click()}>Importar Excel</button>
          <input ref={fileInputRef} type="file" accept=".xlsx" onChange={onImportFile} style={{ display: 'none' }} />
          <button className="adm-btn" onClick={openCreate}>+ Nuevo Proveedor</button>
        </div>
      </div>

      {error && <div className="adm-alert error">{error}</div>}
      {importMsg && <div className="adm-alert success">{importMsg}</div>}

      <div className="adm-toolbar">
        <input
          className="adm-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o CUIT..."
          style={{ flex: 1, maxWidth: 280 }}
        />
        <label className="adm-checkbox-row">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Mostrar inactivos
        </label>
      </div>

      <div className="adm-card adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>CUIT</th>
              <th>Contacto</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5}><div className="adm-loading">Cargando…</div></td></tr>
            )}
            {!loading && suppliers.map((s) => (
              <tr key={s.id} className={s.active ? '' : 'inactive'}>
                <td>
                  <div className="adm-table-name">{s.companyOrFullName}</div>
                  <div className="adm-table-sub">{IVA_CONDITION_LABEL[s.ivaCondition]}</div>
                </td>
                <td>{s.taxId || '-'}</td>
                <td>{s.phone || s.cell || s.email || '-'}</td>
                <td><span className={`adm-badge ${s.active ? 'ok' : 'danger'}`}>{s.active ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <div className="adm-table-actions">
                    <button className="adm-link-btn" onClick={() => openEdit(s)}>Editar</button>
                    {s.active ? (
                      <button className="adm-link-btn danger" onClick={() => onDelete(s)}>Eliminar</button>
                    ) : (
                      <button className="adm-link-btn success" onClick={() => onActivate(s)}>Reactivar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && suppliers.length === 0 && <div className="adm-empty">Sin proveedores.</div>}
      </div>

      {form && (
        <SupplierFormModal
          form={form}
          isNew={!form.id}
          saving={saving}
          onChange={setForm}
          onCancel={() => setForm(null)}
          onSave={onSave}
        />
      )}
    </div>
  )
}

function SupplierFormModal({ form, isNew, saving, onChange, onCancel, onSave }: {
  form: SupplierForm
  isNew: boolean
  saving: boolean
  onChange: (f: SupplierForm) => void
  onCancel: () => void
  onSave: () => void
}) {
  const [cuitCheck, setCuitCheck] = useState<'idle' | 'valid' | 'invalid'>('idle')
  useEscapeKey(onCancel)

  const set = <K extends keyof SupplierForm>(key: K, value: SupplierForm[K]) => onChange({ ...form, [key]: value })

  const addContact = () => set('contactPersons', [...form.contactPersons, { name: '', role: '', cell: '', phone: '', email: '' }])
  const updateContact = (i: number, patch: Partial<ContactPersonForm>) => {
    const next = [...form.contactPersons]
    next[i] = { ...next[i], ...patch }
    set('contactPersons', next)
  }
  const removeContact = (i: number) => set('contactPersons', form.contactPersons.filter((_, idx) => idx !== i))

  const addField = () => set('customFields', [...form.customFields, { label: '', value: '' }])
  const updateField = (i: number, patch: Partial<CustomFieldForm>) => {
    const next = [...form.customFields]
    next[i] = { ...next[i], ...patch }
    set('customFields', next)
  }
  const removeField = (i: number) => set('customFields', form.customFields.filter((_, idx) => idx !== i))

  return (
    <div className="adm-modal-backdrop">
      <div className="adm-modal" style={{ width: 680 }}>
        <h2 className="adm-modal-title">{isNew ? 'Nuevo Proveedor' : 'Editar Proveedor'}</h2>

        <SectionTitle>Proveedor</SectionTitle>
        <Field label="Nombre de la Empresa o Nombre y Apellido">
          <input className="adm-input" value={form.companyOrFullName} onChange={(e) => set('companyOrFullName', e.target.value)} style={{ width: '100%' }} />
        </Field>
        <div className="adm-grid-2" style={{ marginTop: 8 }}>
          <Field label="Nombre"><input className="adm-input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Apellido"><input className="adm-input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Cel."><input className="adm-input" value={form.cell} onChange={(e) => set('cell', e.target.value)} placeholder="+54 9 11 2345-678" style={{ width: '100%' }} /></Field>
          <Field label="Teléfono"><input className="adm-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Email"><input className="adm-input" value={form.email} onChange={(e) => set('email', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Página Web"><input className="adm-input" value={form.webPage} onChange={(e) => set('webPage', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Domicilio"><input className="adm-input" value={form.address} onChange={(e) => set('address', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Provincia"><input className="adm-input" value={form.province} onChange={(e) => set('province', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Localidad"><input className="adm-input" value={form.locality} onChange={(e) => set('locality', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="C.P."><input className="adm-input" value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Saldo Inicial"><input className="adm-input" type="number" value={form.initialBalance} onChange={(e) => set('initialBalance', e.target.value)} style={{ width: '100%' }} /></Field>
        </div>
        <Field label="Nota">
          <textarea className="adm-textarea" value={form.note} onChange={(e) => set('note', e.target.value)} rows={2} />
        </Field>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono">Personas de Contacto</span>
            <button type="button" className="adm-btn ghost sm" onClick={addContact}>+ Agregar Persona de Contacto</button>
          </div>
          {form.contactPersons.map((cp, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <input className="adm-input" value={cp.name} onChange={(e) => updateContact(i, { name: e.target.value })} placeholder="Nombre" style={{ flex: 2 }} />
              <input className="adm-input" value={cp.role} onChange={(e) => updateContact(i, { role: e.target.value })} placeholder="Cargo" style={{ flex: 1 }} />
              <input className="adm-input" value={cp.cell} onChange={(e) => updateContact(i, { cell: e.target.value })} placeholder="Cel." style={{ flex: 1 }} />
              <input className="adm-input" value={cp.email} onChange={(e) => updateContact(i, { email: e.target.value })} placeholder="Email" style={{ flex: 2 }} />
              <button type="button" className="adm-btn ghost sm" onClick={() => removeContact(i)}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono">Campos custom</span>
            <button type="button" className="adm-btn ghost sm" onClick={addField}>+ Agregar Nuevo campo</button>
          </div>
          {form.customFields.map((cf, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input className="adm-input" value={cf.label} onChange={(e) => updateField(i, { label: e.target.value })} placeholder="Etiqueta" style={{ flex: 1 }} />
              <input className="adm-input" value={cf.value} onChange={(e) => updateField(i, { value: e.target.value })} placeholder="Valor" style={{ flex: 1 }} />
              <button type="button" className="adm-btn ghost sm" onClick={() => removeField(i)}>✕</button>
            </div>
          ))}
        </div>

        <SectionTitle>Compras</SectionTitle>
        <div className="adm-grid-2">
          <Field label="Categoría Compras"><input className="adm-input" value={form.purchasesCategory} onChange={(e) => set('purchasesCategory', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Descuento General %"><input className="adm-input" type="number" value={form.purchasesDiscountPercent} onChange={(e) => set('purchasesDiscountPercent', e.target.value)} style={{ width: '100%' }} /></Field>
        </div>
        <Field label="Nota Interna">
          <textarea className="adm-textarea" value={form.noteInternal} onChange={(e) => set('noteInternal', e.target.value)} rows={2} />
        </Field>

        <SectionTitle>Datos de Facturación</SectionTitle>
        <Field label="Razón social (Nombre de la Empresa o Nombre y Apellido)">
          <input className="adm-input" value={form.billingCompanyOrFullName} onChange={(e) => set('billingCompanyOrFullName', e.target.value)} placeholder={form.companyOrFullName} style={{ width: '100%' }} />
        </Field>
        <div className="adm-grid-2" style={{ marginTop: 8 }}>
          <Field label="N° de Doc. (CUIT)">
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="adm-input" value={form.taxId} onChange={(e) => { set('taxId', e.target.value); setCuitCheck('idle') }} placeholder="20-12345678-9" style={{ flex: 1 }} />
              <button type="button" className="adm-btn ghost sm" onClick={() => setCuitCheck(isValidCuit(form.taxId) ? 'valid' : 'invalid')}>Verificar</button>
            </div>
            {cuitCheck === 'valid' && <span className="adm-badge ok" style={{ marginTop: 6 }}>✓ CUIT válido</span>}
            {cuitCheck === 'invalid' && <span className="adm-badge danger" style={{ marginTop: 6 }}>✗ CUIT inválido</span>}
          </Field>
          <Field label="Condición de IVA">
            <select className="adm-select" value={form.ivaCondition} onChange={(e) => set('ivaCondition', e.target.value as IvaCondition)} style={{ width: '100%' }}>
              {Object.entries(IVA_CONDITION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Comprobante por defecto">
            <select className="adm-select" value={form.defaultReceiptType} onChange={(e) => set('defaultReceiptType', e.target.value as DefaultReceiptType)} style={{ width: '100%' }}>
              {Object.entries(RECEIPT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Teléfono"><input className="adm-input" value={form.billingPhone} onChange={(e) => set('billingPhone', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Cel."><input className="adm-input" value={form.billingCell} onChange={(e) => set('billingCell', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Domicilio fiscal"><input className="adm-input" value={form.fiscalAddress} onChange={(e) => set('fiscalAddress', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Localidad"><input className="adm-input" value={form.fiscalLocality} onChange={(e) => set('fiscalLocality', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Provincia"><input className="adm-input" value={form.fiscalProvince} onChange={(e) => set('fiscalProvince', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="C.P."><input className="adm-input" value={form.fiscalPostalCode} onChange={(e) => set('fiscalPostalCode', e.target.value)} style={{ width: '100%' }} /></Field>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="adm-btn" onClick={onSave} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button className="adm-btn ghost" onClick={onCancel} style={{ flex: 1 }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mono" style={{ fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', margin: '24px 0 12px', paddingTop: 16, borderTop: '1px solid var(--adm-border)' }}>
      {children}
    </h3>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="adm-field">
      <label className="adm-field-label">{label}</label>
      {children}
    </div>
  )
}
