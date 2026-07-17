export function isValidCuit(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11) return false

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const sum = weights.reduce((acc, w, i) => acc + w * Number(digits[i]), 0)
  const mod = 11 - (sum % 11)
  const checkDigit = mod === 11 ? 0 : mod === 10 ? 9 : mod
  return checkDigit === Number(digits[10])
}
