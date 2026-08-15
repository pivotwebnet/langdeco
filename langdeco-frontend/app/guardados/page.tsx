import type { Metadata } from 'next'
import { getProducts } from '@/lib/api'
import { toProduct } from '@/lib/product-mapper'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Guardados } from '@/components/sections/Guardados'

export const metadata: Metadata = {
  title: 'Guardados — LasLangDeco',
  description: 'Las piezas que guardaste para no perderlas de vista.',
}

export default async function GuardadosPage() {
  const products = await getProducts()

  return (
    <>
      <Header />
      <main className="pd-page">
        <PageHeader
          label="Guardados"
          kicker="Tu selección"
          title="Lo que guardaste"
          intro="Las piezas que marcaste con el corazón, todas juntas acá."
        />
        <Guardados products={products.map(toProduct)} />
      </main>
      <Footer />
    </>
  )
}
