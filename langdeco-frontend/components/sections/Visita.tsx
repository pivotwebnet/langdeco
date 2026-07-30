import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { Consultas } from '@/components/sections/Consultas'
import * as Icon from '@/components/ui/Icon'

const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/laslangdeco/',
    cls: 'ig',
    icon: <Icon.Instagram />,
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/5493492287864',
    cls: 'wa',
    icon: <Icon.Whatsapp style={{ width: 20, height: 20 }} />,
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/laslangdeco/',
    cls: 'fb',
    icon: <Icon.Facebook />,
  },
]

const INFO = [
  { label: 'Dirección', value: <>Sgto. Cabral 104<br />S2300 Rafaela · Santa Fe</> },
  { label: 'Horario', value: <>9:00—12:00<br />15:30—19:30</> },
  { label: 'Teléfono', value: '3492 28-7864' },
  { label: 'Cita previa', value: 'laslangdeco@gmail.com' },
]

export function Visita() {
  return (
    <section id="visita" data-dt="visita" className="visita-section">

      {/* ── Columna: título + info + redes ──────────────────────── */}
      <div className="visita-col-info">
        <RevealOnScroll delay={1}>
          <span className="kicker" style={{ display: 'block', marginBottom: 14 }}>Rafaela · Santa Fe</span>
          <h2 className="display visita-h2">
            El showroom<br />está siempre{' '}
            <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}>abierto</em>.
          </h2>
        </RevealOnScroll>

        <RevealOnScroll delay={2}>
          <div className="visita-info-grid">
            {INFO.map((item) => (
              <div key={item.label} className="visita-info-item">
                <div className="mono" style={{ marginBottom: 6 }}>{item.label}</div>
                <div style={{ lineHeight: 1.4 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={3}>
          <div className="visita-socials">
            <div className="mono" style={{ marginBottom: 16, fontSize: 9, letterSpacing: '0.22em' }}>Seguinos en redes</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {SOCIALS.map((s, i) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={`social-link ${s.cls}`}
                  style={{ animationDelay: `${i * 0.12}s` }}
                >
                  <div className="social-icon">
                    {s.icon}
                    <div className="social-shine" />
                  </div>
                  <div className={`social-aura social-aura-${s.cls}`} />
                  <span className="mono" style={{ fontSize: 8, marginTop: 6, letterSpacing: '0.14em' }}>{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>

      {/* ── Columna: formulario de consulta ─────────────────────── */}
      <div className="visita-col-form">
        <Consultas />
      </div>
    </section>
  )
}
