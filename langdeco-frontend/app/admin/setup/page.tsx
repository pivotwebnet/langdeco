import { redirect } from 'next/navigation'
import { setupRequired } from '@/lib/admin-credentials'
import SetupForm from './SetupForm'

// Ver comentario equivalente en app/admin/(protected)/layout.tsx — misma
// razón: setupRequired() no dispara la detección automática de Next, así que
// se fuerza explícito para que nunca quede congelada del momento del build.
export const dynamic = 'force-dynamic'

export default async function SetupPage() {
  if (!(await setupRequired())) {
    redirect('/admin/login')
  }

  return <SetupForm />
}
