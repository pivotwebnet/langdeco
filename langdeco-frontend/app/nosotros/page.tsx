import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Nosotros } from '@/components/sections/Nosotros'

export const metadata: Metadata = {
  title: 'Nosotros — LasLangDeco',
  description: 'Desde 2014 elegimos, a mano, mobiliario y objetos para hogares que no tienen apuro.',
}

export default function NosotrosPage() {
  return (
    <>
      <Header />
      <main className="pd-page">
        <PageHeader label="Nosotros" />
        <Nosotros />
      </main>
      <Footer />
    </>
  )
}
