import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/layout/PageHeader'
import { LegalSection } from '@/components/ui/LegalSection'
import { getSiteContent } from '@/lib/site-content'

export const metadata: Metadata = {
  title: 'Política de privacidad — LasLangDeco',
  description: 'Cómo tratamos los datos personales que nos compartís en LasLangDeco.',
}

const PENDIENTE = 'Pendiente de completar en el panel admin.'

export default async function PoliticaDePrivacidadPage() {
  const { privacidad } = (await getSiteContent()).legal

  return (
    <>
      <Header />
      <main className="pd-page">
        <PageHeader
          label="Política de privacidad"
          kicker="Legal"
          title="Política de privacidad"
          intro="Qué datos recolectamos cuando nos escribís y cómo los usamos."
        />

        <section style={{ padding: '0 24px 96px', maxWidth: 720, margin: '0 auto' }}>
          <LegalSection title="Qué datos recolectamos">
            <p>
              Cuando completás el formulario de contacto, recolectamos tu nombre, email y el mensaje que nos escribís.
            </p>
          </LegalSection>

          <LegalSection title="Para qué los usamos">
            <p>
              Usamos esos datos exclusivamente para responder tu consulta o coordinar tu compra, envío o devolución. No
              los usamos con fines comerciales de terceros.
            </p>
          </LegalSection>

          <LegalSection title="Con quién los compartimos">
            <p>{privacidad.terceros || PENDIENTE}</p>
          </LegalSection>

          <LegalSection title="Cookies">
            <p>
              El sitio utiliza cookies técnicas necesarias para su funcionamiento (por ejemplo, para mantener los
              productos en tu carrito de compras). {privacidad.cookies || PENDIENTE}
            </p>
          </LegalSection>

          <LegalSection title="Tus derechos">
            <p>
              Podés solicitar acceso, rectificación o eliminación de tus datos personales escribiéndonos a{' '}
              <a href="mailto:laslangdeco@gmail.com">laslangdeco@gmail.com</a>.
            </p>
          </LegalSection>
        </section>
      </main>
      <Footer />
    </>
  )
}
