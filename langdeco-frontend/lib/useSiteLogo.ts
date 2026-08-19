'use client'

import { useEffect, useState } from 'react'

const DEFAULT_LOGO = '/assets/logo.png'

let cachedLogoUrl: string | null = null
let inFlight: Promise<string | null> | null = null

function fetchLogoUrl(): Promise<string | null> {
  if (cachedLogoUrl !== null) return Promise.resolve(cachedLogoUrl)
  if (!inFlight) {
    inFlight = fetch('/api/admin/site-content')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { logoUrl?: string } | null) => {
        cachedLogoUrl = data?.logoUrl || DEFAULT_LOGO
        return cachedLogoUrl
      })
      .catch(() => null)
      .finally(() => { inFlight = null })
  }
  return inFlight
}

// Header y Footer montan a la vez en cada página — este hook comparte un único
// fetch de /api/admin/site-content (y su resultado) entre ambos en vez de que
// cada uno pida el logo por separado.
export function useSiteLogo(): string {
  const [logoUrl, setLogoUrl] = useState(cachedLogoUrl ?? DEFAULT_LOGO)

  useEffect(() => {
    let cancelled = false
    fetchLogoUrl().then((url) => { if (!cancelled && url) setLogoUrl(url) })
    return () => { cancelled = true }
  }, [])

  return logoUrl
}
