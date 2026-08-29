import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminToastProvider } from '@/components/admin/AdminToast'
import { setupRequired } from '@/lib/admin-credentials'
import { isValidSessionToken, SESSION_COOKIE } from '@/lib/admin-session'

// setupRequired() lee un archivo en disco, no una API que Next reconozca como
// dinámica (cookies()/headers()) — si el redirect() de acá arriba se dispara
// antes de llegar a cookies() más abajo, el build puede pre-renderizar esta
// ruta como estática y hornear ese resultado para siempre. Forzado explícito
// para que siempre se evalúe en cada request real.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — LasLangDeco',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (await setupRequired()) {
    redirect('/admin/setup')
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!isValidSessionToken(token)) {
    redirect('/admin/login')
  }

  return (
    <AdminToastProvider>
      <div className="adm-shell">
        <AdminSidebar />
        <main className="adm-main">
          {children}
        </main>
      </div>
    </AdminToastProvider>
  )
}
