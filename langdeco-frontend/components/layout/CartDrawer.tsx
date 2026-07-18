'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/cart'
import * as Icon from '@/components/ui/Icon'
import { formatPrice } from '@/lib/data'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, count, total, remove, setQty, clear } = useCart()

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(10,10,10,0.4)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.3s ease',
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(420px, 100vw)',
          background: 'var(--bg)',
          zIndex: 201,
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.45s cubic-bezier(.2,.7,.2,1)',
          boxShadow: '-20px 0 60px -20px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--line)' }}>
          <div>
            <span className="mono">Selección</span>
            {count > 0 && <span className="mono" style={{ marginLeft: 8 }}>{count} {count === 1 ? 'pieza' : 'piezas'}</span>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar carrito">
            <Icon.Close />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 0' }}>
          {items.length === 0 ? (
            <div style={{ paddingTop: 80, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-edit)', fontStyle: 'italic', fontSize: 28, marginBottom: 12 }}>
                La selección está vacía.
              </div>
              <p className="mono">Añade piezas desde el catálogo.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: 16, paddingBottom: 24, borderBottom: '1px solid var(--line)', marginBottom: 24 }}>
                {/* Image placeholder */}
                <div style={{ width: 72, height: 88, background: '#ECEAE4', flexShrink: 0, borderRadius: 4 }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 500 }}>{item.name}</span>
                    <button onClick={() => remove(item.id)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-mute)', padding: 0 }}>
                      <Icon.Trash />
                    </button>
                  </div>
                  <div className="mono" style={{ marginBottom: 12 }}>{item.material}</div>

                  {/* Qty + price row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--line)' }}>
                      <button
                        onClick={() => setQty(item.id, item.qty - 1)}
                        style={{ width: 32, height: 32, background: 'none', border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                      >
                        <Icon.Minus />
                      </button>
                      <span style={{ width: 28, textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 14 }}>{item.qty}</span>
                      <button
                        onClick={() => setQty(item.id, item.qty + 1)}
                        style={{ width: 32, height: 32, background: 'none', border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                      >
                        <Icon.Plus />
                      </button>
                    </div>
                    <span className="mono" style={{ fontSize: 12 }}>{formatPrice(item.priceNum * item.qty)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '20px 24px 32px', borderTop: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="mono">Total selección</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 18 }}>{formatPrice(total)}</span>
            </div>
            <p className="mono" style={{ marginBottom: 20, fontSize: 9 }}>
              Precios orientativos · el precio final se confirma con asesoría
            </p>
            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                const msg = encodeURIComponent(`Hola, me interesan estas piezas:\n${items.map(i => `• ${i.name} (${i.qty}x) — ${i.price}`).join('\n')}\nTotal estimado: ${formatPrice(total)}`)
                window.open(`https://wa.me/34914321860?text=${msg}`, '_blank')
              }}
            >
              <Icon.Whatsapp /> Consultar con Cande
            </button>
            <button
              onClick={clear}
              style={{ width: '100%', marginTop: 12, background: 'none', border: 0, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-mute)', padding: '8px 0' }}
            >
              Vaciar selección
            </button>
          </div>
        )}
      </div>
    </>
  )
}
