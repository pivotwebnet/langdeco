'use client'

import { useEffect } from 'react'
import * as Icon from '@/components/ui/Icon'
import { useEscapeKey, backdropClose } from '@/lib/useEscapeKey'
import { GIFT_CARD_URL, GIFT_CARD_COPY } from '@/lib/gift-card-config'

interface GiftCardModalProps {
  open: boolean
  onClose: () => void
}

export function GiftCardModal({ open, onClose }: GiftCardModalProps) {
  useEscapeKey(onClose)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label="Gift Card">
      <div className="modal-backdrop" {...backdropClose(onClose)}>
        <div className="giftcard-modal" onClick={(e) => e.stopPropagation()}>
          <button className="icon-btn giftcard-modal-close" onClick={onClose} aria-label="Cerrar">
            <Icon.Close />
          </button>

          <div className="giftcard-modal-badge"><Icon.Gift width={26} height={26} /></div>

          <div className="mono giftcard-modal-eyebrow">{GIFT_CARD_COPY.eyebrow}</div>
          <h3 className="giftcard-modal-title">{GIFT_CARD_COPY.title}</h3>
          <p className="giftcard-modal-body">{GIFT_CARD_COPY.body}</p>

          <button
            className="btn giftcard-modal-cta"
            onClick={() => {
              window.open(GIFT_CARD_URL, '_blank', 'noopener,noreferrer')
              onClose()
            }}
          >
            {GIFT_CARD_COPY.cta} <Icon.Arrow />
          </button>

          <button className="giftcard-modal-dismiss" onClick={onClose}>
            {GIFT_CARD_COPY.dismiss}
          </button>
        </div>
      </div>
    </div>
  )
}
