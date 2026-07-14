import { redirect } from 'next/navigation'
import { setupRequired } from '@/lib/admin-credentials'
import SetupForm from './SetupForm'

export default async function SetupPage() {
  if (!(await setupRequired())) {
    redirect('/admin/login')
  }

  return <SetupForm />
}
