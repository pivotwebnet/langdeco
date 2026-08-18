import { test, expect } from '@playwright/test'

// Smoke test end-to-end: navegar al catálogo, ver que carga productos reales
// del backend, y que agregar uno al carrito actualiza el contador del header.
test('catálogo muestra productos y agregar al carrito actualiza el contador', async ({ page }) => {
  await page.goto('/catalogo')

  await expect(page.locator('.prod-card').first()).toBeVisible()

  const cartCount = page.locator('.cart-pill span')
  await expect(cartCount).toHaveText('0')

  await page.locator('.prod-card button[aria-label="Añadir al carrito"]').first().click()

  await expect(cartCount).toHaveText('1')
})

test('la home carga y el header muestra el logo', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('img.logo-img')).toBeVisible()
})
