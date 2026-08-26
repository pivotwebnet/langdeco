export const MIN_PASSWORD_LENGTH = 10

export function isPasswordStrong(password: string): boolean {
  if (password.length < MIN_PASSWORD_LENGTH) return false
  return /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
}

export const PASSWORD_REQUIREMENTS_HINT = `Mínimo ${MIN_PASSWORD_LENGTH} caracteres, con al menos una letra y un número.`
