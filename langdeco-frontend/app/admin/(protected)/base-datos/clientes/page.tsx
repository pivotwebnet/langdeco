'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { BackendClient, DefaultReceiptType, IvaCondition } from '@/lib/backend-types'
import { isValidCuit } from '@/lib/cuit'
import { IVA_CONDITION_LABEL, RECEIPT_TYPE_LABEL } from '@/lib/party-labels'
import { useEscapeKey } from '@/lib/useEscapeKey'

type ContactPersonForm = { name: string; role: string; cell: string; phone: string; email: string }
type CustomFieldForm = { label: string; value: string }

type ClientForm = {
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
  nicknameML: string
  salesCategory: string
  salesDiscountPercent: string
  noteForClient: string
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

const EMPTY_FORM: ClientForm = {
  id: null, companyOrFullName: '', firstName: '', lastName: '', cell: '', phone: '', email: '', webPage: '',
  address: '', province: '', postalCode: '', locality: '', note: '', initialBalance: '0',
  nicknameML: '', salesCategory: '', salesDiscountPercent: '0', noteForClient: '',
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

export default function ClientesAdmin() {
  const [clients, setClients] = useState<BackendClient[]>([])
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ClientForm | null>(null)
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
      setClients(await api<BackendClient[]>(`/clients?${qs}`))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [search, showInactive])

  useEffect(() => { load() }, [load])

  const openCreate = () => setForm({ ...EMPTY_FORM })

  const openEdit = (c: BackendClient) => setForm({
    id: c.id, companyOrFullName: c.companyOrFullName, firstName: c.firstName || '', lastName: c.lastName || '',
    cell: c.cell || '', phone: c.phone || '', email: c.email || '', webPage: c.webPage || '',
    address: c.address || '', province: c.province || '', postalCode: c.postalCode || '', locality: c.locality || '',
    note: c.note || '', initialBalance: String(c.initialBalance),
    nicknameML: c.nicknameML || '', salesCategory: c.salesCategory || '', salesDiscountPercent: String(c.salesDiscountPercent),
    noteForClient: c.noteForClient || '',
    billingCompanyOrFullName: c.billingCompanyOrFullName, taxId: c.taxId || '',
    ivaCondition: c.ivaCondition, defaultReceiptType: c.defaultReceiptType,
    billingPhone: c.billingPhone || '', billingCell: c.billingCell || '',
    fiscalAddress: c.fiscalAddress || '', fiscalLocality: c.fiscalLocality || '',
    fiscalProvince: c.fiscalProvince || '', fiscalPostalCode: c.fiscalPostalCode || '',
    contactPersons: c.contactPersons.map((cp) => ({ name: cp.name, role: cp.role || '', cell: cp.cell || '', phone: cp.phone || '', email: cp.email || '' })),
    customFields: c.customFields.map((cf) => ({ ...cf })),
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
        nicknameML: form.nicknameML || null, salesCategory: form.salesCategory || null,
        salesDiscountPercent: Number(form.salesDiscountPercent) || 0, noteForClient: form.noteForClient || null,
        billingCompanyOrFullName: form.billingCompanyOrFullName || form.companyOrFullName, taxId: form.taxId || null,
        ivaCondition: form.ivaCondition, defaultReceiptType: form.defaultReceiptType,
        billingPhone: form.billingPhone || null, billingCell: form.billingCell || null,
        fiscalAddress: form.fiscalAddress || null, fiscalLocality: form.fiscalLocality || null,
        fiscalProvince: form.fiscalProvince || null, fiscalPostalCode: form.fiscalPostalCode || null,
        contactPersons: form.contactPersons.filter((cp) => cp.name.trim()).map((cp) => ({ name: cp.name, role: cp.role || null, cell: cp.cell || null, phone: cp.phone || null, email: cp.email || null })),
        customFields: form.customFields.filter((cf) => cf.label.trim()),
      }

      if (form.id) {
        await api(`/clients/${form.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await api(`/clients`, { method: 'POST', body: JSON.stringify(payload) })
      }

      setForm(null)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (c: BackendClient) => {
    if (!confirm(`¿Eliminar/desactivar "${c.companyOrFullName}"?`)) return
    try {
      await api(`/clients/${c.id}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const onActivate = async (c: BackendClient) => {
    try {
      await api(`/clients/${c.id}/activate`, { method: 'POST' })
      await load()
    } catch (e) {
      setError((e as Error).message)
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
      const res = await fetch('/api/admin/backend/clients/import', { method: 'POST', body: formData })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
      setImportMsg(`Importación completa: ${data.created} creados, ${data.updated} actualizados${data.errors?.length ? `, ${data.errors.length} con error` : ''}.`)
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 32, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)' }}>
            Clientes
          </h1>
          <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginTop: 6 }}>
            {clients.length} clientes
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="btn ghost" style={{ fontSize: 11 }} href="/api/admin/backend/clients/export" download="clientes.xlsx">Exportar Excel</a>
          <button className="btn ghost" style={{ fontSize: 11 }} onClick={() => fileInputRef.current?.click()}>Importar Excel</button>
          <input ref={fileInputRef} type="file" accept=".xlsx" onChange={onImportFile} style={{ display: 'none' }} />
          <button className="btn" style={{ fontSize: 11 }} onClick={openCreate}>+ Nuevo Cliente</button>
        </div>
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>{error}</div>}
      {importMsg && <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>{importMsg}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o CUIT..."
          style={{ flex: 1, maxWidth: 280, border: '1px solid var(--line)', background: 'white', padding: '10px 14px', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink)', outline: 'none' }}
        />
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Mostrar inactivos
        </label>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--line)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px 140px', padding: '12px 24px', borderBottom: '1px solid var(--line)', background: '#F8F7F4' }}>
          {['Nombre', 'CUIT', 'Contacto', 'Estado', ''].map((h) => (
            <span key={h} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>{h}</span>
          ))}
        </div>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-mute)' }}>Cargando...</div>}
        {!loading && clients.map((c, i) => (
          <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px 140px', padding: '14px 24px', borderBottom: i < clients.length - 1 ? '1px solid var(--line)' : 'none', alignItems: 'center', opacity: c.active ? 1 : 0.5 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500 }}>{c.companyOrFullName}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)' }}>{IVA_CONDITION_LABEL[c.ivaCondition]}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{c.taxId || '-'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{c.phone || c.cell || c.email || '-'}</div>
            <div>
              <span className="mono" style={{ fontSize: 9, color: c.active ? '#065F46' : '#991B1B' }}>{c.active ? 'Activo' : 'Inactivo'}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => openEdit(c)} style={linkBtn}>Editar</button>
              {c.active ? (
                <button onClick={() => onDelete(c)} style={{ ...linkBtn, color: '#991B1B' }}>Eliminar</button>
              ) : (
                <button onClick={() => onActivate(c)} style={{ ...linkBtn, color: '#065F46' }}>Reactivar</button>
              )}
            </div>
          </div>
        ))}
        {!loading && clients.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: 'var(--font-edit)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 18 }}>
            Sin clientes.
          </div>
        )}
      </div>

      {form && (
        <ClientFormModal
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

function ClientFormModal({ form, isNew, saving, onChange, onCancel, onSave }: {
  form: ClientForm
  isNew: boolean
  saving: boolean
  onChange: (f: ClientForm) => void
  onCancel: () => void
  onSave: () => void
}) {
  const [cuitCheck, setCuitCheck] = useState<'idle' | 'valid' | 'invalid'>('idle')
  useEscapeKey(onCancel)

  const set = <K extends keyof ClientForm>(key: K, value: ClientForm[K]) => onChange({ ...form, [key]: value })

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 20 }}>
      <div style={{ background: 'white', width: 680, maxHeight: '90vh', overflowY: 'auto', padding: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 20px' }}>{isNew ? 'Nuevo Cliente' : 'Editar Cliente'}</h2>

        <SectionTitle>Cliente</SectionTitle>
        <Field label="Nombre de la Empresa o Nombre y Apellido">
          <input value={form.companyOrFullName} onChange={(e) => set('companyOrFullName', e.target.value)} style={{ ...inputStyle, width: '100%' }} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
          <Field label="Nombre"><input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} style={inputStyle} /></Field>
          <Field label="Apellido"><input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} style={inputStyle} /></Field>
          <Field label="Cel."><input value={form.cell} onChange={(e) => set('cell', e.target.value)} placeholder="+54 9 11 2345-678" style={inputStyle} /></Field>
          <Field label="Teléfono"><input value={form.phone} onChange={(e) => set('phone', e.target.value)} style={inputStyle} /></Field>
          <Field label="Email"><input value={form.email} onChange={(e) => set('email', e.target.value)} style={inputStyle} /></Field>
          <Field label="Apodo ML"><input value={form.nicknameML} onChange={(e) => set('nicknameML', e.target.value)} style={inputStyle} /></Field>
          <Field label="Página Web"><input value={form.webPage} onChange={(e) => set('webPage', e.target.value)} style={inputStyle} /></Field>
          <Field label="Domicilio"><input value={form.address} onChange={(e) => set('address', e.target.value)} style={inputStyle} /></Field>
          <Field label="Provincia"><input value={form.province} onChange={(e) => set('province', e.target.value)} style={inputStyle} /></Field>
          <Field label="Localidad"><input value={form.locality} onChange={(e) => set('locality', e.target.value)} style={inputStyle} /></Field>
          <Field label="C.P."><input value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} style={inputStyle} /></Field>
          <Field label="Saldo Inicial"><input type="number" value={form.initialBalance} onChange={(e) => set('initialBalance', e.target.value)} style={inputStyle} /></Field>
        </div>
        <Field label="Nota">
          <textarea value={form.note} onChange={(e) => set('note', e.target.value)} rows={2} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
        </Field>

        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono">Personas de Contacto</span>
            <button type="button" onClick={addContact} style={smallBtnStyle}>+ Agregar Persona de Contacto</button>
          </div>
          {form.contactPersons.map((cp, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <input value={cp.name} onChange={(e) => updateContact(i, { name: e.target.value })} placeholder="Nombre" style={{ ...inputStyle, flex: 2 }} />
              <input value={cp.role} onChange={(e) => updateContact(i, { role: e.target.value })} placeholder="Cargo" style={{ ...inputStyle, flex: 1 }} />
              <input value={cp.cell} onChange={(e) => updateContact(i, { cell: e.target.value })} placeholder="Cel." style={{ ...inputStyle, flex: 1 }} />
              <input value={cp.email} onChange={(e) => updateContact(i, { email: e.target.value })} placeholder="Email" style={{ ...inputStyle, flex: 2 }} />
              <button type="button" onClick={() => removeContact(i)} style={smallBtnStyle}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono">Campos custom</span>
            <button type="button" onClick={addField} style={smallBtnStyle}>+ Agregar Nuevo campo</button>
          </div>
          {form.customFields.map((cf, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input value={cf.label} onChange={(e) => updateField(i, { label: e.target.value })} placeholder="Etiqueta" style={{ ...inputStyle, flex: 1 }} />
              <input value={cf.value} onChange={(e) => updateField(i, { value: e.target.value })} placeholder="Valor" style={{ ...inputStyle, flex: 1 }} />
              <button type="button" onClick={() => removeField(i)} style={smallBtnStyle}>✕</button>
            </div>
          ))}
        </div>

        <SectionTitle>Ventas</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Categoría Ventas"><input value={form.salesCategory} onChange={(e) => set('salesCategory', e.target.value)} style={inputStyle} /></Field>
          <Field label="Descuento General %"><input type="number" value={form.salesDiscountPercent} onChange={(e) => set('salesDiscountPercent', e.target.value)} style={inputStyle} /></Field>
        </div>
        <Field label="Nota para el Cliente">
          <textarea value={form.noteForClient} onChange={(e) => set('noteForClient', e.target.value)} rows={2} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
        </Field>

        <SectionTitle>Datos de Facturación</SectionTitle>
        <Field label="Razón social (Nombre de la Empresa o Nombre y Apellido)">
          <input value={form.billingCompanyOrFullName} onChange={(e) => set('billingCompanyOrFullName', e.target.value)} placeholder={form.companyOrFullName} style={{ ...inputStyle, width: '100%' }} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
          <Field label="N° de Doc. (CUIT)">
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={form.taxId} onChange={(e) => { set('taxId', e.target.value); setCuitCheck('idle') }} placeholder="20-12345678-9" style={{ ...inputStyle, flex: 1 }} />
              <button type="button" onClick={() => setCuitCheck(isValidCuit(form.taxId) ? 'valid' : 'invalid')} style={smallBtnStyle}>Verificar</button>
            </div>
            {cuitCheck === 'valid' && <span style={{ fontSize: 11, color: '#065F46' }}>✓ CUIT válido</span>}
            {cuitCheck === 'invalid' && <span style={{ fontSize: 11, color: '#991B1B' }}>✗ CUIT inválido</span>}
          </Field>
          <Field label="Condición de IVA">
            <select value={form.ivaCondition} onChange={(e) => set('ivaCondition', e.target.value as IvaCondition)} style={inputStyle}>
              {Object.entries(IVA_CONDITION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Comprobante por defecto">
            <select value={form.defaultReceiptType} onChange={(e) => set('defaultReceiptType', e.target.value as DefaultReceiptType)} style={inputStyle}>
              {Object.entries(RECEIPT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Teléfono"><input value={form.billingPhone} onChange={(e) => set('billingPhone', e.target.value)} style={inputStyle} /></Field>
          <Field label="Cel."><input value={form.billingCell} onChange={(e) => set('billingCell', e.target.value)} style={inputStyle} /></Field>
          <Field label="Domicilio fiscal"><input value={form.fiscalAddress} onChange={(e) => set('fiscalAddress', e.target.value)} style={inputStyle} /></Field>
          <Field label="Localidad"><input value={form.fiscalLocality} onChange={(e) => set('fiscalLocality', e.target.value)} style={inputStyle} /></Field>
          <Field label="Provincia"><input value={form.fiscalProvince} onChange={(e) => set('fiscalProvince', e.target.value)} style={inputStyle} /></Field>
          <Field label="C.P."><input value={form.fiscalPostalCode} onChange={(e) => set('fiscalPostalCode', e.target.value)} style={inputStyle} /></Field>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn" onClick={onSave} disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button className="btn ghost" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 13, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', margin: '24px 0 12px', paddingTop: 16, borderTop: '1px solid var(--line)' }}>
      {children}
    </h3>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-mute)', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid var(--line)', fontSize: 13, fontFamily: 'var(--font-ui)', width: '100%' }
const smallBtnStyle: React.CSSProperties = { padding: '4px 10px', border: '1px solid var(--line)', background: 'white', cursor: 'pointer', fontSize: 11 }
const linkBtn: React.CSSProperties = {
  background: 'none', border: 0, cursor: 'pointer', fontFamily: 'ui-monospace, monospace',
  fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', padding: 0,
}
