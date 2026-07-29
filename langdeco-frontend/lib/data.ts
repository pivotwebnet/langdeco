export function formatPrice(n: number): string {
  return '$ ' + Math.round(n).toLocaleString('de-DE')
}
