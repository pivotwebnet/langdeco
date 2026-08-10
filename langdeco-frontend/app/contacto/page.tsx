import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Visita } from '@/components/sections/Visita'

export const metadata: Metadata = {
  title: 'Contacto — LasLangDeco',
  description: 'Showroom en Rafaela, Santa Fe. Dirección, horario y contacto de LasLangDeco.',
}

export default function ContactoPage() {
  return (
    <>
      <Header />
      <main className="pd-page">
        <PageHeader label="Contacto" />
        <Visita />
      </main>
      <Footer />
    </>
  )
}
