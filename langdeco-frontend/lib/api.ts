import type { BackendCategory, BackendProduct } from './backend-types'

const API_URL = process.env.API_URL || 'http://localhost:5279'
const ADMIN_KEY = process.env.BACKEND_ADMIN_KEY || ''

// Si el backend .NET no responde en este tiempo, se corta la espera en vez de
// dejar colgada la página entera — ver app/error.tsx para lo que ve el visitante.
const BACKEND_TIMEOUT_MS = 8000

async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: 'no-store',
      headers: { ...init?.headers },
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    })
  } catch (e) {
    if (e instanceof Error && e.name === 'TimeoutError') {
      throw new Error(`Backend no respondió en ${BACKEND_TIMEOUT_MS}ms en ${path}`)
    }
    throw e
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Backend ${res.status} en ${path}: ${body}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function getProducts(params?: { category?: string; featured?: boolean }): Promise<BackendProduct[]> {
  const qs = new URLSearchParams()
  if (params?.category) qs.set('category', params.category)
  if (params?.featured !== undefined) qs.set('featured', String(params.featured))
  const query = qs.toString()
  return backendFetch<BackendProduct[]>(`/api/products${query ? `?${query}` : ''}`)
}

export async function getProductById(id: string): Promise<BackendProduct | null> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api/products/${id}`, { cache: 'no-store', signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS) })
  } catch (e) {
    if (e instanceof Error && e.name === 'TimeoutError') {
      throw new Error(`Backend no respondió en ${BACKEND_TIMEOUT_MS}ms en /api/products/${id}`)
    }
    throw e
  }
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Backend ${res.status} en /api/products/${id}`)
  return res.json()
}

export function getCategories(): Promise<BackendCategory[]> {
  return backendFetch<BackendCategory[]>('/api/categories')
}

// Server-side helper para las rutas /api/admin/backend/* : agrega X-Admin-Key
// y reenvía el pedido al backend .NET (que vive en red interna).
export async function forwardToBackend(path: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers)
  if (ADMIN_KEY) headers.set('X-Admin-Key', ADMIN_KEY)

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  })
}
