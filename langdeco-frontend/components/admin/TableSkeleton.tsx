// Filas de esqueleto con shimmer para tablas del admin mientras cargan — mismo patrón
// visual que ya usan las stat-cards del dashboard (`adm-skel`), antes solo texto plano
// "Cargando…" en el resto del panel.
export function TableSkeletonRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          <td colSpan={columns} style={{ padding: '16px 22px' }}>
            <div className="adm-skel" style={{ height: 14, width: `${72 - i * 6}%` }} />
          </td>
        </tr>
      ))}
    </>
  )
}
