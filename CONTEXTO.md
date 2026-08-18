# Contexto del Proyecto — LasLongDeco

E-commerce/panel de gestión para un negocio de decoración. **No hay integración de pago online**: las ventas se registran manualmente desde el panel (transferencia, efectivo o WhatsApp). El panel `/admin` gestiona productos, categorías, ventas, presupuestos, y una base de datos de clientes y proveedores, con comprobantes en PDF e import/export en Excel.

> Este documento reemplaza una versión anterior que describía un modelo de "Órdenes" (`Order`) con checkout público, Mercado Pago (Checkout Pro) y verificación de reseñas — ese modelo **no existe en este repo**; corresponde a un proyecto hermano y quedó pegado acá por error. El modelo real de este proyecto es **Sale/Budget** (venta manual / presupuesto), sin checkout ni pasarela de pago. Ver `README.md` en la raíz para la referencia completa y más al día; este archivo resume lo mismo con otro enfoque.

## Stack

```
langdeco/
├── backend/            .NET 10 Web API + PostgreSQL (Entity Framework Core)
└── langdeco-frontend/  Next.js (App Router) + React
```

El backend .NET vive pensado para quedar en red interna (no expuesto directo en producción). El frontend Next.js hace de frontend público **y** de BFF para el panel admin: `/admin/*` llama a rutas propias de Next (`app/api/admin/backend/[...path]/route.ts`) que validan la sesión y reenvían al backend agregando `X-Admin-Key` — el navegador nunca ve la URL interna del backend ni esa clave.

## Modelo de datos (backend)

- **Category** / **Product**: catálogo. `Product` tiene soft-delete (`Active`), `WholesalePrice` opcional (precio mayorista, debe ser menor al precio de lista), specs (ficha técnica) y hasta 6 fotos.
- **Sale** (venta manual) / **Budget** (presupuesto): comprobantes con numeración correlativa propia (`Number`), `CustomerInfo` embebido (copia impresa, no cambia si el cliente real se edita después), `DiscountType` (`Percent`/`Fixed`, admite negativo = recargo), IVA %, `PriceType` por línea (`Retail`/`Wholesale`) y vínculo opcional a un `Client` de la Base de Datos. `Sale` descuenta stock y tiene `Status` (`Pending`/`Paid`/`Cancelled`); `Budget` no toca stock, tiene `ValidUntil` y `Status` (`Open`/`Converted`/`Expired`/`Cancelled`) y se puede convertir en `Sale` real (`POST /api/budgets/{id}/convert`).
- **Client** / **Supplier**: maestros completos (contacto, domicilio, Personas de Contacto, Campos custom, datos de facturación con CUIT validado).
- **DocumentCounter**: numeración correlativa atómica por tipo de comprobante.
- **CompanySettings**: datos de encabezado de los PDF.

## Reglas de negocio y seguridad (viven en el backend, no se saltean desde el frontend)

- **Totales siempre recalculados en el servidor**: precio, subtotal, descuento e IVA nunca se toman de lo que manda el cliente.
- **Stock atómico**: se descuenta al vender/convertir un presupuesto (`UPDATE ... WHERE Stock >= cantidad`, sin sobreventa), se repone al cancelar.
- **Numeración correlativa** sin condición de carrera (`UPDATE ... RETURNING` sobre `DocumentCounters`).
- **CUIT**: formato + dígito verificador (módulo 11 argentino) validado en el backend y en el botón "Verificar" del frontend (este último 100% client-side).
- **Borrado con integridad referencial**: Cliente/Proveedor con ventas o presupuestos asociados se desactiva en vez de borrarse.
- **Seguridad `X-Admin-Key`**: filtro `RequireAdminKey` sobre endpoints administrativos. Se configura con `AdminApiKey` (backend) = `BACKEND_ADMIN_KEY` (frontend). Comparación timing-safe (`AdminKeyComparer`) y **falla cerrada**: si `AdminApiKey` está vacía, todo pedido admin se rechaza (ya no se salta el chequeo con la clave vacía como antes).
- **Catálogo público** (`GET /api/products`, `GET /api/categories`): sin clave, solo activos.
- **Validación de producto**: `Name`/`Material` obligatorios (antes daba 500 sin mensaje claro).
- **Consultas** (`POST /api/inquiries`, público): el formulario de contacto del sitio crea leads reales, leídos en `/admin/clientes` — no es un dato de muestra.

## Despliegue (checklist)

1. **`AdminApiKey` (backend) = `BACKEND_ADMIN_KEY` (frontend)**, valor aleatorio largo.
2. **`ADMIN_SESSION_SECRET`** aleatorio y largo — firma la cookie de sesión del panel; si falta, se usa un default inseguro.
3. **Backend en red interna**: exponer públicamente solo el frontend Next.js.
4. **Persistir** el volumen de Postgres y `DATA_DIR` del frontend (contraseña del panel `admin.json`, `site-content.json`, imágenes subidas en `DATA_DIR/uploads`) — sin esto, cada redeploy pierde la base o borra la configuración/fotos.
5. **`NEXT_PUBLIC_SITE_URL`** con el dominio real de producción — `app/sitemap.ts`/`app/robots.ts`/metadata de producto (Open Graph, JSON-LD) ya existen y usan esta variable (`lib/site-url.ts`); sin definirla, siguen apuntando a `localhost:3000`.

## Storage de imágenes y contenido

`DATA_DIR` (`lib/storage.ts`) guarda `admin.json` (contraseña del panel), `site-content.json` (contenido editable del sitio: Hero, logo, Nosotros —fotos y todos los textos—, Inspiración, barra de promo) y `DATA_DIR/uploads` (imágenes), servidas por `GET /api/media/<archivo>` (`lib/media.ts`). Es storage local por decisión explícita del usuario mientras no haya credenciales de Cloudflare R2 — migrar reemplazando el cuerpo de `saveUploadedImage()` en `lib/media.ts`.

## Resiliencia, SEO y tests

- `app/error.tsx`/`app/not-found.tsx` con la identidad visual del sitio, y timeout de 8s en los fetches al backend (`lib/api.ts`) — antes el sitio se caía feo si el backend estaba lento/caído.
- `app/sitemap.ts`, `app/robots.ts`, metadata + JSON-LD por producto, `metadataBase` en `app/layout.tsx`.
- Tests chicos pero reales: backend (xUnit, `backend.Tests/`) sobre precios/descuentos/IVA y stock; frontend (Vitest) sobre `formatPrice`/`normalize`/`isValidCuit`; e2e (Playwright) sobre catálogo+carrito y home. No es cobertura exhaustiva.

## Requisitos para correr en local

Backend:
```bash
cd backend
dotnet ef database update    # o se aplican solas al arrancar
dotnet run                   # http://localhost:5279
```
Requiere .NET 10 SDK y PostgreSQL con una base `langdeco`. La cadena de conexión real va en `backend/appsettings.Development.json` (gitignored).

Frontend:
```bash
cd langdeco-frontend
npm install
npm run dev     # necesita el backend corriendo en API_URL, ver .env.local
```

Ver `README.md` en la raíz para el detalle completo de endpoints, panel admin, y el estado de la UI de precio mayorista (backend completo, frontend pendiente).
