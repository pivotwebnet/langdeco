import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { setupRequired } from '@/lib/admin-credentials'
import { isValidSessionToken, SESSION_COOKIE } from '@/lib/admin-session'
import LoginForm from './LoginForm'

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
