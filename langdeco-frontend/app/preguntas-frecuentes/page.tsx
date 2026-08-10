import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes — LasLangDeco',
  description: 'Respuestas a las dudas más comunes sobre compras, envíos y devoluciones en LasLangDeco.',
}

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: '¿Cómo pago mi pedido?',
    a: (
      <>
        Hoy no contamos con pago online en el sitio. Coordinamos cada compra por WhatsApp o email, donde te confirmamos
        los medios de pago disponibles. Más detalles en <Link href="/como-comprar">Cómo comprar</Link>.
      </>
    ),
  },
  {
    q: '¿Hacen envíos a todo el país?',
    a: '[COMPLETAR: zonas de cobertura de envío]',
  },
  {
    q: '¿Puedo retirar en el showroom?',
    a: 'Sí, en Sgto. Cabral 104, Rafaela, Santa Fe. Horario de atención: 9:00–12:00 y 15:30–19:30.',
  },
  {
    q: '¿Cuánto tarda en llegar mi pedido?',
    a: '[COMPLETAR: plazo estimado de entrega según zona]',
  },
  {
    q: '¿Puedo devolver un producto?',
    a: (
      <>
        Sí. Revisá las condiciones en <Link href="/envios-y-devoluciones">Envíos y devoluciones</Link> y, si compraste a
        distancia, tu derecho de arrepentimiento en <Link href="/boton-de-arrepentimiento">Botón de arrepentimiento</Link>.
      </>
    ),
  },
  {
    q: '¿Las piezas tienen garantía?',
    a: '[COMPLETAR: condiciones de garantía por producto]',
  },
  {
    q: '¿Cómo sé si un producto está disponible?',
    a: 'Escribinos por WhatsApp antes de coordinar el pago — el stock se actualiza a mano y te confirmamos disponibilidad al momento.',
  },
]

export default function PreguntasFrecuentesPage() {
  return (
    <>
      <Header />
      <main className="pd-page">
        <PageHeader
          label="Preguntas frecuentes"
          kicker="Ayuda"
          title="Preguntas frecuentes"
          intro="Las dudas más comunes antes de comprar. Si no encontrás la tuya, escribinos."
        />

        <section style={{ padding: '0 24px 96px', maxWidth: 720 }}>
          {FAQS.map((item) => (
            <details key={item.q} style={{ borderTop: '1px solid var(--line)', padding: '18px 0' }}>
              <summary
                style={{
                  cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 500,
                  color: 'var(--ink)', listStyle: 'none',
                }}
              >
                {item.q}
              </summary>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 15, lineHeight: 1.7, color: 'var(--ink-soft)', margin: '12px 0 0' }}>
                {item.a}
              </p>
            </details>
          ))}
        </section>
      </main>
      <Footer />
    </>
  )
}
