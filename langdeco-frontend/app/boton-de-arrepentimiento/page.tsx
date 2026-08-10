import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/layout/PageHeader'
import { LegalSection } from '@/components/ui/LegalSection'
import { ArrepentimientoForm } from '@/components/sections/ArrepentimientoForm'

const WHATSAPP_NUMBER = '5493492287864'

export const metadata: Metadata = {
  title: 'Botón de arrepentimiento — LasLangDeco',
  description: 'Ejercé tu derecho de arrepentimiento en compras a distancia, conforme a la Ley 24.240.',
}

export default function BotonDeArrepentimientoPage() {
  return (
    <>
      <Header />
      <main className="pd-page">
        <PageHeader
          label="Botón de arrepentimiento"
          kicker="Ayuda · Derecho del consumidor"
          title="Botón de arrepentimiento"
          intro="Si compraste a distancia (por WhatsApp, email u otro medio fuera de un local comercial), tenés derecho a arrepentirte de la compra."
        />

        <section style={{ padding: '0 24px 48px', maxWidth: 720 }}>
          <LegalSection title="Tu derecho">
            <p>
              De acuerdo con el artículo 34 de la Ley de Defensa del Consumidor (N.º 24.240), en las compras realizadas a
              distancia tenés derecho a revocar la aceptación de la compra dentro de los diez (10) días corridos contados
              a partir de la entrega del bien, sin costo alguno y sin necesidad de justificar el motivo.
            </p>
          </LegalSection>

          <LegalSection title="Cómo ejercerlo">
            <p>
              Completá el formulario debajo con tus datos y la referencia del pedido, o escribinos directamente por
              WhatsApp o email. Te confirmamos la recepción de tu solicitud y coordinamos la devolución del producto y el
              reintegro del pago.
            </p>
          </LegalSection>

          <LegalSection title="Condiciones de la devolución">
            <p>
              [COMPLETAR: quién cubre el costo del flete de devolución, en qué estado debe encontrarse el producto y el
              plazo de reintegro del dinero]
            </p>
          </LegalSection>
        </section>

        <section style={{ padding: '0 24px 32px', maxWidth: 720 }}>
          <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: 20, fontWeight: 500, margin: '0 0 16px', color: 'var(--ink)' }}>
            Solicitar arrepentimiento
          </h2>
          <ArrepentimientoForm />
        </section>

        <section style={{ padding: '0 24px 96px', maxWidth: 720 }}>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20, marginTop: 12 }}>
            <p className="mono" style={{ marginBottom: 10 }}>¿Preferís otro canal?</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="btn ghost" style={{ textDecoration: 'none' }}>
                Hablar por WhatsApp
              </a>
              <a href="mailto:laslangdeco@gmail.com" className="btn ghost" style={{ textDecoration: 'none' }}>
                laslangdeco@gmail.com
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
