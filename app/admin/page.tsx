import { PIEZAS_MAYORES, PEQUENOS_TESOROS, SELECCION } from '@/lib/data'

const STATS = [
  { label: 'Productos activos', value: PIEZAS_MAYORES.length + PEQUENOS_TESOROS.length },
  { label: 'Selección de Carmen', value: SELECCION.length },
  { label: 'Consultas pendientes', value: 3 },
  { label: 'Entradas lookbook', value: 3 },
]

export default function AdminDashboard() {
  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 36, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)' }}>
          Panel de control
        </h1>
        <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginTop: 8 }}>
          LasLongDeco · Casa &amp; Curaduría
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ background: 'white', border: '1px solid var(--line)', padding: '24px 28px' }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 12 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 48, lineHeight: 1, color: 'var(--ink)' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent items */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-ui)', fontWeight: 400, fontSize: 18, letterSpacing: '-0.01em', margin: '0 0 20px', color: 'var(--ink)' }}>
          Consultas recientes
        </h2>
        <div style={{ background: 'white', border: '1px solid var(--line)' }}>
          {[
            { client: 'María G.', msg: 'Tengo un salón de 28 m² mirando al norte...', product: 'Butaca Laurel', time: 'Hace 2h', status: 'pending' },
            { client: 'Andrés M.', msg: 'Me interesa la Mesa Arenisca pero necesito...', product: 'Mesa Arenisca', time: 'Hace 5h', status: 'replied' },
            { client: 'Laura P.', msg: 'Busco algo para un dormitorio pequeño...', product: 'Cabecero Tela', time: 'Ayer', status: 'pending' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: i < 2 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-deep)', display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 13 }}>
                {item.client.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{item.client}</span>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.06em' }}>{item.time}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-edit)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.msg}
                </p>
              </div>
              <span style={{
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 9, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em', textTransform: 'uppercase',
                background: item.status === 'pending' ? '#FEF3C7' : '#D1FAE5',
                color: item.status === 'pending' ? '#92400E' : '#065F46',
              }}>
                {item.status === 'pending' ? 'Pendiente' : 'Respondida'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
