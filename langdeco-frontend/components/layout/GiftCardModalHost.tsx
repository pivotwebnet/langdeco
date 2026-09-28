'use client'

import { useGiftCardUI } from '@/lib/gift-card'
import { GiftCardModal } from '@/components/layout/GiftCardModal'

export function GiftCardModalHost() {
  const { isOpen, close } = useGiftCardUI()
  return <GiftCardModal open={isOpen} onClose={close} />
}
