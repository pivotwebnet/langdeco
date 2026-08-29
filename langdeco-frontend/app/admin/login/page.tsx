import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { setupRequired } from '@/lib/admin-credentials'
import { isValidSessionToken, SESSION_COOKIE } from '@/lib/admin-session'
import LoginForm from './LoginForm'

// Ver comentario equivalente en app/admin/(protected)/layout.tsx — sin esto,
// Next puede pre-renderizar esta página como estática en el build (donde
// setupRequired() da true por no existir data/admin.json todavía) y quedar
// redirigiendo a /admin/setup para siempre en producción.
export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  if (await setupRequired()) {
    redirect('/admin/setup')
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (isValidSessionToken(token)) {
    redirect('/admin')
  }

  return <LoginForm />
}
