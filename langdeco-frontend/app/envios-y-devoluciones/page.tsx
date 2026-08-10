import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/layout/PageHeader'
import { LegalSection } from '@/components/ui/LegalSection'

export const metadata: Metadata = {
  title: 'Envíos y devoluciones — LasLangDeco',
  description: 'Zonas de envío, plazos y condiciones de devolución de LasLangDeco.',
}

export default function EnviosYDevolucionesPage() {
  return (
    <>
      <Header />
      <main className="pd-page">
        <PageHeader
          label="Envíos y devoluciones"
          kicker="Ayuda"
          title="Envíos y devoluciones"
          intro="Cómo llega tu pedido y qué hacer si algo no sale como esperabas."
        />

        <section style={{ padding: '0 24px 96px', maxWidth: 720 }}>
          <LegalSection title="Zonas de envío">
            <p>[COMPLETAR: zonas de cobertura y transportistas con los que trabajamos]</p>
          </LegalSection>

          <LegalSection title="Costos y plazos">
            <p>[COMPLETAR: costo de envío según zona y tiempo estimado de entrega]</p>
          </LegalSection>

          <LegalSection title="Seguimiento del pedido">
            <p>
              Te avisamos por WhatsApp o email cuando el pedido sale de nuestro showroom y coordinamos el horario de entrega
              con vos.
            </p>
          </LegalSection>

          <LegalSection title="Devoluciones">
            <p>
              Aceptamos devoluciones de productos sin uso, en su embalaje original, dentro de [COMPLETAR: plazo en días]
              desde la entrega. Escribinos por WhatsApp o email para coordinarla.
            </p>
            <p style={{ marginTop: 10 }}>
              Si compraste a distancia y querés ejercer tu derecho de arrepentimiento, visitá{' '}
              <Link href="/boton-de-arrepentimiento">Botón de arrepentimiento</Link>.
            </p>
          </LegalSection>

          <LegalSection title="Piezas dañadas en el envío">
            <p>
              Si tu pedido llega dañado, contactanos dentro de las [COMPLETAR: 48 horas / plazo] siguientes a la entrega con
              fotos del estado del producto y el embalaje.
            </p>
          </LegalSection>
        </section>
      </main>
      <Footer />
    </>
  )
}
