import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { setupRequired } from '@/lib/admin-credentials'
import { isValidSessionToken, SESSION_COOKIE } from '@/lib/admin-session'

export const metadata: Metadata = {
  title: 'Admin — LasLongDeco',
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F7F4', fontFamily: 'var(--font-ui)' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
