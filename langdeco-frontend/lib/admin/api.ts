// Helper de fetch compartido por las páginas del panel admin — antes cada
// page.tsx redeclaraba esta misma función.
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
  return data as T
}

// Variante que antepone el proxy del backend (`/api/admin/backend/...`), el caso común.
export async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  return adminFetch<T>(`/api/admin/backend${path}`, init)
}
