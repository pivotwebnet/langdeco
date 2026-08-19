import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/layout/PageHeader'
import { LegalSection } from '@/components/ui/LegalSection'
import { getSiteContent } from '@/lib/site-content'

export const metadata: Metadata = {
  title: 'Envíos y devoluciones — LasLangDeco',
  description: 'Zonas de envío, plazos y condiciones de devolución de LasLangDeco.',
}

const PENDIENTE = 'Pendiente de completar en el panel admin.'

export default async function EnviosYDevolucionesPage() {
  const { envios } = (await getSiteContent()).legal

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

        <section style={{ padding: '0 24px 96px', maxWidth: 720, margin: '0 auto' }}>
          <LegalSection title="Zonas de envío">
            <p>{envios.zonas || PENDIENTE}</p>
          </LegalSection>

          <LegalSection title="Costos y plazos">
            <p>{envios.costosPlazos || PENDIENTE}</p>
          </LegalSection>

          <LegalSection title="Seguimiento del pedido">
            <p>
              Te avisamos por WhatsApp o email cuando el pedido sale de nuestro showroom y coordinamos el horario de entrega
              con vos.
            </p>
          </LegalSection>

          <LegalSection title="Devoluciones">
            <p>
              Aceptamos devoluciones de productos sin uso, en su embalaje original, dentro de{' '}
              {envios.plazoDevolucionDias ? `${envios.plazoDevolucionDias} días` : '[plazo a confirmar]'}
              {' '}desde la entrega. Escribinos por WhatsApp o email para coordinarla.
            </p>
            <p style={{ marginTop: 10 }}>
              Si compraste a distancia (por WhatsApp, email u otro medio fuera de un local comercial), de acuerdo con el
              artículo 34 de la Ley de Defensa del Consumidor (N.º 24.240) tenés derecho a revocar la compra dentro de los
              diez (10) días corridos desde la entrega del bien, sin costo ni necesidad de justificar el motivo.
              Escribinos por WhatsApp o email para ejercerlo.
            </p>
          </LegalSection>

          <LegalSection title="Piezas dañadas en el envío">
            <p>
              Si tu pedido llega dañado, contactanos dentro de{' '}
              {envios.plazoDanioHoras ? `las ${envios.plazoDanioHoras}` : '[plazo a confirmar]'}
              {' '}siguientes a la entrega con fotos del estado del producto y el embalaje.
            </p>
          </LegalSection>
        </section>
      </main>
      <Footer />
    </>
  )
}
