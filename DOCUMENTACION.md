# Documentación del Proyecto — LasLongDeco

E-commerce de decoración/mobiliario curado ("Casa & Curaduría"), **sin integración de pago online**: todas las ventas se registran manualmente desde el panel (transferencia, efectivo o WhatsApp). Este documento describe el backend agregado, el panel de administración real y cómo levantar todo en local.

## Estructura del repo

```
langdeco/
├── backend/            .NET 10 Web API + PostgreSQL
└── langdeco-frontend/  Next.js 16 (App Router) + React 19
```

Arquitectura: el backend .NET vive en red interna (no expuesto directo en producción). El frontend Next.js actúa como frontend + BFF: renderiza el catálogo público con Server Components que consultan el backend directamente, y expone rutas propias (`/api/admin/*`) que agregan autenticación y el header `X-Admin-Key` antes de reenviar al backend. El navegador nunca ve la URL interna del backend ni la clave de admin.

---

## Backend (`backend/`)

### Modelo de datos (EF Core + PostgreSQL)

- **Category**: `Id` (slug), `Name`, `Active`.
- **Product**: `Id` (slug), `Name`, `CategoryId`, `Tag?`, `Material`, `Origin?`, `Price`, `OriginalPrice?` (precio tachado), `Stock`, `Note?`, `Aspect?`, `Active` (soft-delete), `Featured` (para la sección "Selección de Carmen" de la home), con tablas hijas `ProductSpec` (ficha técnica) y `ProductImage` (hasta 6 fotos, la primera es la portada).
- **Sale** (venta manual — no hay "orden" con pago online): `ClientName`, `ClientContact?`, `ClientType` (`Retail` | `Wholesale`), `Status` (`Pending` | `Paid` | `Cancelled`), `PaymentMethod` (`Transfer` | `Cash` | `Other`), `Total` (recalculado en el servidor), `CreatedAt`.
- **SaleItem**: guarda `ProductName` y `UnitPrice` como snapshot al momento de la venta (aunque el producto cambie de precio o se borre después, la venta conserva el dato histórico real).

Migraciones: `AddInitialSchema`, `AddProductFeatured`. Al levantar en `Development`, el backend aplica migraciones pendientes automáticamente y hace *seed* de 22 productos de muestra (18 del catálogo + 4 destacados) si la base está vacía.

### Reglas de negocio (fuente de verdad — no se pueden saltear desde el frontend)

- **Anti-manipulación de precio**: al crear una venta, el precio y nombre se toman siempre del producto en la DB, nunca de lo que mande el cliente. El total se recalcula server-side.
- **Stock atómico**: se descuenta al vender (rechaza con 400 si no alcanza, sin sobreventa por ventas simultáneas gracias a un `UPDATE ... WHERE Stock >= cantidad`), y se repone automáticamente al cancelar una venta.
- **Máquina de estados de ventas**: `Pending → Paid | Cancelled`, `Paid → Cancelled` (repone stock). `Cancelled` es estado final. Transiciones inválidas devuelven 400.
- **Borrado de productos**: si el producto tiene ventas asociadas se **desactiva** (soft-delete, conserva historial); si no tiene ventas, se elimina de verdad.
- **Categorías**: no se pueden eliminar si tienen productos asociados.
- **Validaciones**: `Id` de producto/categoría debe ser un slug (`minúsculas-números-guiones`), precio y stock no negativos, `OriginalPrice > Price` si está presente, máximo 6 fotos por producto y ninguna vacía.
- **Seguridad `X-Admin-Key`**: filtro `RequireAdminKeyFilter` (`backend/Filters/`) sobre los endpoints administrativos (todo lo de `SalesController`, y los POST/PUT/DELETE de productos y categorías). El frontend agrega el header server-side. Si `AdminApiKey` está vacía en `appsettings.json` (modo dev), no se exige nada; en producción es obligatorio definirla — si queda vacía, cualquiera que llegue al backend puede leer/crear/borrar todo.
- **Catálogo público**: `GET /api/products` y `GET /api/categories` no requieren clave y devuelven solo activos por defecto.

### Endpoints

Públicos (sin clave):
- `GET /api/products` — filtros opcionales `?category=`, `?featured=`
- `GET /api/products/{id}`
- `GET /api/categories`

Admin (requieren `X-Admin-Key`):
- `GET /api/products?includeInactive=true` · `POST /api/products` · `PUT /api/products/{id}` · `POST /api/products/{id}/activate` · `DELETE /api/products/{id}`
- `GET /api/categories?includeInactive=true` · `POST /api/categories` · `PUT /api/categories/{id}` · `POST /api/categories/{id}/activate` · `DELETE /api/categories/{id}`
- `POST /api/sales` — crea venta manual (productos + cantidades, `clientType`, `paymentMethod`, `status` inicial `Pending`/`Paid`)
- `GET /api/sales` — filtros `?status=`, `?clientType=`, `?from=`, `?to=`
- `PATCH /api/sales/{id}/status` — cambia estado (valida transición)
- `GET /api/sales/summary` — ingresos (solo `Paid`), ticket promedio, ranking de productos, desglose minorista/mayorista, y productos con stock ≤ 3 para reposición

Documentación interactiva (solo en Development): **`/swagger`**.

### Configuración local

La cadena de conexión con la contraseña real vive en `backend/appsettings.Development.json` (gitignored, no se versiona). `backend/appsettings.json` (sí versionado) solo tiene un placeholder vacío:
```json
{
  "ConnectionStrings": { "Default": "" },
  "AdminApiKey": ""
}
```
```json
// appsettings.Development.json (no se sube al repo)
{
  "ConnectionStrings": { "Default": "Host=localhost;Port=5432;Database=langdeco;Username=postgres;Password=..." }
}
```
En producción, definir la cadena de conexión por variable de entorno (`ConnectionStrings__Default`), no en un archivo versionado.

Requisitos: .NET 10 SDK, PostgreSQL con una base `langdeco`. Levantar con:
```
cd backend
dotnet ef database update   # aplica migraciones (o se aplican solas al iniciar en Development)
dotnet run --launch-profile http
```
Por defecto queda en `http://localhost:5279`.

---

## Frontend (`langdeco-frontend/`)

### Variables de entorno (`.env.local`, no versionado)

```
API_URL=http://localhost:5279       # backend .NET (interno, NO el puerto de Next)
BACKEND_ADMIN_KEY=                  # debe coincidir con AdminApiKey del backend
ADMIN_SESSION_SECRET=...            # aleatorio y largo — firma la cookie de sesión
# ADMIN_PASSWORD=...                # opcional: si se define, se salta el flujo de /admin/setup
```

### lib/api.ts y lib/backend-types.ts

`lib/api.ts` centraliza el acceso al backend:
- `getProducts()`, `getProductById()`, `getCategories()` — usados desde Server Components (home, página de producto) para leer el catálogo público directamente, sin pasar por una ruta propia.
- `forwardToBackend()` — agrega `X-Admin-Key` desde `BACKEND_ADMIN_KEY` y reenvía al backend; lo usa el proxy admin.

`lib/backend-types.ts` define los tipos que devuelve el backend (camelCase, coincide con el JSON de .NET). `lib/product-mapper.ts` convierte un `BackendProduct` al `Product` (view model) que ya consumen los componentes de la home (`Productos.tsx`, `SeleccionCarmen.tsx`, `ProductoDetalle.tsx`), para no tener que reescribir esos componentes.

### Autenticación del panel admin

Vive enteramente en el frontend (Next.js), no en el backend .NET:
- `lib/admin-credentials.ts` — hash PBKDF2 (100.000 iteraciones), guardado en `DATA_DIR/admin.json` (por defecto `./data/admin.json`, gitignored).
- `lib/admin-session.ts` — cookie de sesión firmada con HMAC-SHA256 (`ADMIN_SESSION_SECRET`), expira a los 7 días.
- `lib/login-rate-limit.ts` — 5 intentos fallidos por IP cada 15 minutos (en memoria).
- Rutas: `app/api/admin/setup/route.ts` (configuración inicial), `app/api/admin/auth/route.ts` (login/logout), `app/api/admin/change-password/route.ts`.

**Cómo decide qué pantalla mostrar:**
```
setupRequired = no existe data/admin.json  Y  no hay ADMIN_PASSWORD
```
- `setupRequired = true` → `/admin/setup` (define contraseña por primera vez).
- Si hay `ADMIN_PASSWORD` en el entorno, se entra directo con esa y `/admin/setup` queda deshabilitado.
- `/admin/(protected)/layout.tsx` es un Server Component que redirige a `/admin/setup` o `/admin/login` según corresponda; todo lo que cuelga de ese route group (dashboard, productos, categorías, ventas, clientes, configuración) requiere sesión válida.

### Proxy admin hacia el backend

`app/api/admin/backend/[...path]/route.ts` es un catch-all que:
1. Valida que exista una cookie de sesión válida (si no, 401).
2. Reenvía el método, body y query string al backend .NET agregando `X-Admin-Key`.

Todas las páginas admin (`productos`, `categorias`, `ventas`, dashboard) llaman a `/api/admin/backend/<recurso>` desde el cliente — nunca llaman al backend directo ni conocen la clave.

### Panel de administración (`app/admin/`)

- **`(protected)/page.tsx`** — Dashboard: ingresos (solo ventas `Paid`), ticket promedio, ranking de productos más vendidos, desglose minorista/mayorista, alerta de reposición de stock.
- **`(protected)/productos/page.tsx`** — ABM completo: alta/edición con specs y fotos (por URL — la subida real de archivos queda pendiente), filtro por categoría, soft-delete/reactivar.
- **`(protected)/categorias/page.tsx`** — ABM de categorías.
- **`(protected)/ventas/page.tsx`** — listado con filtro por estado, "Nueva venta manual" (elige productos + cantidad, tipo de cliente, medio de pago, estado inicial), cambio de estado.
- **`(protected)/clientes/page.tsx`** — Consultas (leads por WhatsApp/email); **sigue con datos mock**, es un módulo aparte de Ventas y no se conectó a un backend real en esta iteración.
- **`(protected)/configuracion/page.tsx`** — cambio de contraseña, cerrar sesión.
- **`setup/`**, **`login/`** — fuera del route group protegido, para no generar loops de redirect.

### Home pública y ficha de producto

- `app/page.tsx` es un Server Component: trae el catálogo y los destacados del backend y se los pasa por props a `app/HomeClient.tsx` (el componente de la home, que sigue siendo `'use client'` por sus animaciones/scroll).
- `components/sections/Productos.tsx` y `components/sections/SeleccionCarmen.tsx` reciben los productos por props en vez de importar `lib/data.ts`.
- `app/producto/[id]/page.tsx` trae el producto y relacionados (misma categoría) del backend.
- `components/sections/Lookbook.tsx` y `components/ui/ProductModal.tsx` (este último no está en uso en ninguna página) **siguen con datos mock** de `lib/data.ts` — quedaron fuera de alcance porque el lookbook no tiene modelo en el backend.

### Requisitos para correr localmente

```
cd langdeco-frontend
npm install
npm run dev     # necesita el backend corriendo en API_URL
```

---

## Pendiente (no incluido en esta iteración)

1. **Subida real de fotos de producto**: hoy el ABM de productos guarda URLs escritas a mano. Falta un endpoint de upload (`DATA_DIR/uploads` + `GET /api/media/<archivo>`) para subir imágenes desde la PC, como en el patrón de referencia de otros proyectos.
2. **Despliegue**: no se aprovisionó ninguna infraestructura real. Al desplegar (Coolify + Cloudflare o el esquema que se elija):
   - Definir `AdminApiKey` (backend) = `BACKEND_ADMIN_KEY` (frontend) con un valor aleatorio largo — **si queda vacía, la API admin queda completamente abierta**.
   - Definir `ADMIN_SESSION_SECRET` aleatorio y largo — si falta, la cookie de sesión sería falsificable.
   - El backend .NET debe quedar en red interna, accesible solo desde el contenedor del frontend (no exponer su puerto públicamente).
   - Persistir `DATA_DIR` (contraseña del panel) en un volumen — sin esto, cada redeploy borra `admin.json` y hay que rehacer el setup.
   - Postgres con su propio volumen persistente.
3. **Consultas (leads)**: sigue siendo un módulo mock, sin backend propio.
4. **Lookbook**: sigue siendo contenido estático de `lib/data.ts`.
