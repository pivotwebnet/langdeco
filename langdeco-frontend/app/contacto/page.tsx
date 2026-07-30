import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Visita } from '@/components/sections/Visita'

export const metadata: Metadata = {
  title: 'Contacto — LasLangDeco',
  description: 'Showroom en Rafaela, Santa Fe. Dirección, horario y contacto de LasLangDeco.',
}

export default function ContactoPage() {
  return (
    <>
      <Header />
      <Visita />
      <Footer />
    </>
  )
}
