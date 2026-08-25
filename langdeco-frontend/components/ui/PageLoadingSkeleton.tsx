// Esqueleto genérico para loading.tsx — Home/Catálogo/Ficha de producto/Nosotros esperan al
// backend .NET (hasta 8s de timeout) sin ningún feedback visual antes de esto.
export function PageLoadingSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'detail' | 'hero' }) {
  if (variant === 'detail') {
    return (
      <div style={{ padding: '48px 24px', maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 32 }}>
        <div className="pd-skel" style={{ aspectRatio: '4/5', width: '100%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="pd-skel" style={{ height: 14, width: '30%' }} />
          <div className="pd-skel" style={{ height: 32, width: '70%' }} />
          <div className="pd-skel" style={{ height: 20, width: '40%' }} />
          <div className="pd-skel" style={{ height: 90, width: '100%', marginTop: 12 }} />
        </div>
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <div style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="pd-skel" style={{ height: 14, width: 120, marginBottom: 24 }} />
        <div className="pd-skel" style={{ height: 64, width: '60%', marginBottom: 16 }} />
        <div className="pd-skel" style={{ height: 64, width: '45%', marginBottom: 32 }} />
        <div className="pd-skel" style={{ height: 16, width: '35%' }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '48px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="pd-skel" style={{ height: 32, width: '40%', marginBottom: 12 }} />
      <div className="pd-skel" style={{ height: 16, width: '25%', marginBottom: 32 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="pd-skel" style={{ aspectRatio: '3/4', width: '100%' }} />
        ))}
      </div>
    </div>
  )
}
