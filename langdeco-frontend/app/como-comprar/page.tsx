import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/layout/PageHeader'
import { LegalSection } from '@/components/ui/LegalSection'

export const metadata: Metadata = {
  title: 'Cómo comprar — LasLangDeco',
  description: 'Cómo funciona el proceso de compra en LasLangDeco, paso a paso.',
}

export default function ComoComprarPage() {
  return (
    <>
      <Header />
      <main className="pd-page">
        <PageHeader
          label="Cómo comprar"
          kicker="Ayuda"
          title="Cómo comprar en LasLangDeco"
          intro="Coordinamos cada compra a mano — sin checkout automático de por medio."
        />

        <section style={{ padding: '0 24px 96px', maxWidth: 720 }}>
          <LegalSection title="1. Explorá el catálogo">
            <p>
              Recorré el <Link href="/catalogo">catálogo</Link> completo o filtrá entre Piezas Mayores y Pequeños Tesoros.
              Cada producto tiene su ficha con fotos, medidas y precio de referencia.
            </p>
          </LegalSection>

          <LegalSection title="2. Consultá disponibilidad">
            <p>
              Escribinos por WhatsApp o completá el formulario de contacto mencionando la pieza que te interesa.
              Te confirmamos stock y detalles antes de avanzar.
            </p>
          </LegalSection>

          <LegalSection title="3. Coordinamos el pedido">
            <p>
              Hoy el sitio no procesa pagos online: cada compra se coordina personalmente por WhatsApp o email.
              Ahí te confirmamos el precio final, la forma de pago disponible (transferencia, efectivo en showroom, entre otras)
              y el plazo de entrega.
            </p>
          </LegalSection>

          <LegalSection title="4. Retiro o envío">
            <p>
              Una vez confirmado el pago, coordinamos el retiro en nuestro showroom de Rafaela o el envío a domicilio.
              Más detalles en <Link href="/envios-y-devoluciones">Envíos y devoluciones</Link>.
            </p>
          </LegalSection>
        </section>
      </main>
      <Footer />
    </>
  )
}
