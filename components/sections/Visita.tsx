import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
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
    href: 'https://api.whatsapp.com/message/GSQBBOQOUQ4JP1?autoload=1&app_absent=0',
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

export function Visita() {
  return (
    <section id="visita" data-dt="visita" style={{ position: 'relative', padding: '64px 24px 72px', background: 'var(--bg-deep)' }}>

      <RevealOnScroll delay={1}>
        <h2 className="display" style={{ fontSize: 32, margin: '0 0 28px' }}>
          El showroom<br />está siempre{' '}
          <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}>abierto</em>.
        </h2>
      </RevealOnScroll>

      {/* ── Redes sociales ────────────────────────────────────────── */}
      <RevealOnScroll delay={2}>
        <div style={{ marginBottom: 36 }}>
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

      {/* ── Mapa ─────────────────────────────────────────────────── */}
      <RevealOnScroll delay={3}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', marginBottom: 20, background: '#DDDCD5', overflow: 'hidden' }}>
          <iframe
            title="Showroom · Sgto. Cabral 104, Rafaela"
            src="https://maps.google.com/maps?q=-31.254139,-61.488861&output=embed&z=16"
            style={{ border: 0, width: '100%', height: '100%', display: 'block', filter: 'grayscale(0.25) contrast(1.05)' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </RevealOnScroll>

      {/* ── Info ─────────────────────────────────────────────────── */}
      <RevealOnScroll delay={4}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, fontSize: 13 }}>
          <div>
            <div className="mono" style={{ marginBottom: 6 }}>Dirección</div>
            <div style={{ lineHeight: 1.4 }}>Sgto. Cabral 104<br />S2300 Rafaela · Santa Fe</div>
          </div>
          <div>
            <div className="mono" style={{ marginBottom: 6 }}>Horario</div>
            <div style={{ lineHeight: 1.4 }}>Lun—Vie · 10:30—20:00<br />Sáb · 11:00—14:30</div>
          </div>
          <div>
            <div className="mono" style={{ marginBottom: 6 }}>Teléfono</div>
            <div>+34 914 32 18 60</div>
          </div>
          <div>
            <div className="mono" style={{ marginBottom: 6 }}>Cita previa</div>
            <div>asesoria@laslongdeco.es</div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  )
}
