import { defineConfig, devices } from '@playwright/test'

// Requiere que el frontend (y el backend .NET) ya estén corriendo en
// localhost:3000 / localhost:5279 — no levanta los servidores automáticamente,
// porque este proyecto necesita ambos procesos (ver README para el arranque manual).
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
