import type { Metadata } from 'next'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const metadata: Metadata = {
  title: 'Admin — LasLongDeco',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F7F4', fontFamily: 'var(--font-ui)' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
