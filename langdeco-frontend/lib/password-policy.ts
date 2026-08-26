export const MIN_PASSWORD_LENGTH = 10

export interface PasswordChecklist {
  length: boolean
  hasLetter: boolean
  hasNumber: boolean
}

export function checkPassword(password: string): PasswordChecklist {
  return {
    length: password.length >= MIN_PASSWORD_LENGTH,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  }
}

export function isPasswordStrong(password: string): boolean {
  const { length, hasLetter, hasNumber } = checkPassword(password)
  return length && hasLetter && hasNumber
}

export const PASSWORD_REQUIREMENTS_HINT = `Mínimo ${MIN_PASSWORD_LENGTH} caracteres, con al menos una letra y un número.`
