# ── Dependencias ──────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js incrusta las variables NEXT_PUBLIC_* en el JS del navegador durante
# el build (no las lee en runtime) — hace falta declararla como ARG y pasarla
# a ENV acá para que "npm run build" la vea. Marcá esta misma variable como
# Build Variable en Coolify (además de runtime) para que llegue hasta acá.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN npm run build

# ── Runtime ───────────────────────────────────────────────────────────
# output:standalone (next.config.ts) arma un server mínimo con solo los
# node_modules que realmente usa — evita copiar node_modules entero acá.
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Fotos subidas, contenido editable del sitio y contraseña de admin viven acá
# (ver lib/storage.ts) — en Coolify hay que montarle un volumen persistente
# a esta ruta, si no se pierde todo en cada redeploy.
ENV DATA_DIR=/app/data
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
