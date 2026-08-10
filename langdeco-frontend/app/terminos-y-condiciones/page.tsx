import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/layout/PageHeader'
import { LegalSection } from '@/components/ui/LegalSection'

export const metadata: Metadata = {
  title: 'Términos y condiciones — LasLangDeco',
  description: 'Términos y condiciones de uso del sitio de LasLangDeco.',
}

export default function TerminosYCondicionesPage() {
  return (
    <>
      <Header />
      <main className="pd-page">
        <PageHeader
          label="Términos y condiciones"
          kicker="Legal"
          title="Términos y condiciones"
          intro="Las reglas que rigen el uso de este sitio y las compras coordinadas a través de él."
        />

        <section style={{ padding: '0 24px 96px', maxWidth: 720 }}>
          <LegalSection title="Aceptación de los términos">
            <p>
              El uso de este sitio implica la aceptación de estos términos y condiciones. Si no estás de acuerdo con
              alguno de sus puntos, te pedimos que no lo utilices.
            </p>
          </LegalSection>

          <LegalSection title="Uso del sitio">
            <p>
              El contenido de este sitio es para uso personal y no comercial. No está permitido reproducir, copiar o
              distribuir su contenido sin autorización previa.
            </p>
          </LegalSection>

          <LegalSection title="Productos, precios y disponibilidad">
            <p>
              Los precios publicados son de referencia y están sujetos a stock y a cambios sin previo aviso. El sitio no
              procesa pagos online: el precio final y la forma de pago se confirman al coordinar la compra por WhatsApp
              o email.
            </p>
          </LegalSection>

          <LegalSection title="Propiedad intelectual">
            <p>
              Las fotografías, textos y demás contenido del sitio son propiedad de LasLangDeco
              [COMPLETAR: razón social / CUIT] o de sus autores originales, y no pueden utilizarse sin autorización.
            </p>
          </LegalSection>

          <LegalSection title="Limitación de responsabilidad">
            <p>
              Hacemos lo posible por mantener la información del sitio actualizada, pero no garantizamos que esté libre
              de errores en todo momento. Cualquier duda sobre un producto puede confirmarse antes de coordinar la compra.
            </p>
          </LegalSection>

          <LegalSection title="Modificaciones">
            <p>
              Podemos actualizar estos términos en cualquier momento. Los cambios entran en vigencia desde su publicación
              en esta página.
            </p>
          </LegalSection>

          <LegalSection title="Contacto">
            <p>
              Ante cualquier consulta sobre estos términos, escribinos a{' '}
              <a href="mailto:laslangdeco@gmail.com">laslangdeco@gmail.com</a>.
            </p>
          </LegalSection>
        </section>
      </main>
      <Footer />
    </>
  )
}
