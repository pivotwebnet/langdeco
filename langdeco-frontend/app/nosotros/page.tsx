import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Nosotros } from '@/components/sections/Nosotros'
import { getSiteContent } from '@/lib/site-content'

export const metadata: Metadata = {
  title: 'Nosotros — LasLangDeco',
  description: 'Desde 2014 elegimos, a mano, mobiliario y objetos para hogares que no tienen apuro.',
}

// Sin esto, Next prerenderiza la página como estática en build time (antes de
// que exista el volumen con el contenido editado desde el admin) y los
// cambios del panel nunca se reflejan en producción.
export const dynamic = 'force-dynamic'

export default async function NosotrosPage() {
  const siteContent = await getSiteContent()

  return (
    <>
      <Header />
      <main className="pd-page">
        <PageHeader label="Nosotros" />
        <Nosotros content={siteContent.nosotros} />
      </main>
      <Footer />
    </>
  )
}
