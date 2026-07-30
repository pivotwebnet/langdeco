# Documentación del Proyecto — LasLongDeco

E-commerce de decoración/mobiliario curado, **sin integración de pago online**: todas las ventas se registran manualmente desde el panel (transferencia, efectivo o WhatsApp). El panel también gestiona Presupuestos (con conversión real a Venta), precio mayorista, y una Base de Datos de Clientes/Proveedores con comprobantes en PDF e import/export en Excel. Este documento describe el backend, el panel de administración y el frontend público, y cómo levantar todo en local.

> Este documento se solapa bastante con `README.md` (en la raíz), que es la versión más nueva y completa — ante una duda o contradicción entre ambos, confiar en `README.md` y, en caso de duda real, verificar contra el código (`backend/Models/`, `backend/Controllers/`) en vez de cualquiera de los dos `.md`.

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
- **Product**: `Id` (slug), `Name`, `CategoryId`, `Tag?`, `Material`, `Origin?`, `Price`, `OriginalPrice?` (precio tachado), `WholesalePrice?` (precio mayorista, debe ser menor a `Price`), `Stock`, `Note?`, `Aspect?`, `Active` (soft-delete), `Featured` (para la sección de destacados de la home), con tablas hijas `ProductSpec` (ficha técnica) y `ProductImage` (hasta 6 fotos, la primera es la portada).
- **Sale** (venta manual) y **Budget** (presupuesto — no hay "orden" con pago online, ninguno de los dos): `CustomerInfo` embebido (nombre/contacto/CUIT/domicilio, copia impresa que no cambia si el cliente real se edita después) con `ClientId?` opcional a un `Client` de la Base de Datos, `ClientType` (`Retail`/`Wholesale`), `DiscountType` (`Percent`/`Fixed`, admite negativo = recargo), `TaxRatePercent`, `Total` (recalculado en el servidor), numeración correlativa propia (`Number`), `CreatedAt`. `Sale` tiene además `Status` (`Pending`/`Paid`/`Cancelled`) y `PaymentMethod` (`Transfer`/`Cash`/`Other`); `Budget` tiene `ValidUntil`, `Status` (`Open`/`Converted`/`Expired`/`Cancelled`), `ConvertedSaleId?`/`ConvertedAt?`.
- **SaleItem** / **BudgetItem**: guardan `ProductName` y `UnitPrice` como snapshot al momento de la operación (aunque el producto cambie de precio o se borre después, el comprobante conserva el dato histórico real), más `PriceType` (`Retail`/`Wholesale`) por línea — resuelve contra `Price` o `WholesalePrice` del producto.
- **Client** / **Supplier**: maestros de la Base de Datos (contacto, domicilio, Personas de Contacto, Campos custom, datos de facturación con CUIT validado).
- **DocumentCounter**: numeración correlativa atómica por tipo de comprobante (`Sale`/`Budget`).

Migraciones en `backend/Migrations/` (incluye `AddWholesalePricingAndBudgetConversion`), aplicadas automáticamente al arrancar el backend en todos los entornos. El *seed* de datos de muestra solo corre en `Development` y ya no trae fotos de stock de Unsplash (se limpiaron por completo — un producto sin fotos reales muestra un placeholder en el frontend).

### Reglas de negocio (fuente de verdad — no se pueden saltear desde el frontend)

- **Anti-manipulación de precio**: al crear una venta o presupuesto, el precio y nombre se toman siempre del producto en la DB (según `PriceType` de la línea), nunca de lo que mande el cliente. El total se recalcula server-side.
- **Stock atómico**: se descuenta al vender o al convertir un presupuesto en venta (rechaza con 400 si no alcanza, sin sobreventa por operaciones simultáneas gracias a un `UPDATE ... WHERE Stock >= cantidad`), y se repone automáticamente al cancelar una venta.
- **Máquina de estados de ventas**: `Pending → Paid | Cancelled`, `Paid → Cancelled` (repone stock). `Cancelled` es estado final. Transiciones inválidas devuelven 400.
- **Máquina de estados de presupuestos**: `Open → Converted | Expired | Cancelled`. `Open` vence solo (`BudgetLifecycleService`) al pasar `ValidUntil`. Si la `Sale` generada por una conversión se cancela, el `Budget` vuelve a `Open` (o queda `Expired` si ya venció mientras tanto).
- **Conversión Presupuesto → Venta** (`POST /api/budgets/{id}/convert`): solo sobre `Budget` en estado `Open`; descuenta stock por ítem con rollback si falta alguno, crea la `Sale` con numeración propia y `BudgetId`.
- **Borrado de productos**: si el producto tiene ventas asociadas se **desactiva** (soft-delete, conserva historial); si no tiene ventas, se elimina de verdad.
- **Categorías**: no se pueden eliminar si tienen productos asociados.
- **Validaciones**: `Id` de producto/categoría debe ser un slug (`minúsculas-números-guiones`), precio y stock no negativos, `OriginalPrice > Price` y `WholesalePrice < Price` si están presentes, máximo 6 fotos por producto y ninguna vacía, CUIT con dígito verificador válido en Cliente/Proveedor.
- **Seguridad `X-Admin-Key`**: filtro `RequireAdminKey` sobre los endpoints administrativos. El frontend agrega el header server-side. Si `AdminApiKey` está vacía en `appsettings.json` (modo dev), no se exige nada; en producción es obligatorio definirla — si queda vacía, cualquiera que llegue al backend puede leer/crear/borrar todo.
- **Catálogo público**: `GET /api/products` y `GET /api/categories` no requieren clave y devuelven solo activos por defecto.

### Endpoints

Públicos (sin clave):
- `GET /api/products` — filtros opcionales `?category=`, `?featured=`
- `GET /api/products/{id}`
- `GET /api/categories`

Admin (requieren `X-Admin-Key`):
- `GET /api/products?includeInactive=true` · `POST /api/products` · `PUT /api/products/{id}` · `POST /api/products/{id}/activate` · `DELETE /api/products/{id}`
- `GET /api/categories?includeInactive=true` · `POST /api/categories` · `PUT /api/categories/{id}` · `POST /api/categories/{id}/activate` · `DELETE /api/categories/{id}`
- `POST /api/sales` — crea venta manual (productos + cantidades, `priceType` por línea, `clientType`, `paymentMethod`, `status` inicial `Pending`/`Paid`)
- `GET /api/sales`, `GET /api/sales/{id}`, `PUT /api/sales/{id}` — filtros de listado `?status=`, `?clientType=`, `?from=`, `?to=`
- `PATCH /api/sales/{id}/status` — cambia estado (valida transición)
- `GET /api/sales/{id}/pdf` — comprobante no fiscal
- `GET /api/sales/summary` — ingresos (solo `Paid`), ticket promedio, ranking de productos, desglose minorista/mayorista, y productos con stock ≤ 3 para reposición (filtros opcionales `?from=`/`?to=`)
- `POST /api/budgets`, `GET /api/budgets`, `GET /api/budgets/{id}`, `PUT /api/budgets/{id}`, `PATCH /api/budgets/{id}/status`, `POST /api/budgets/{id}/convert`, `GET /api/budgets/{id}/pdf`
- `POST /api/clients`, `GET /api/clients`, `GET /api/clients/{id}`, `PUT /api/clients/{id}`, `DELETE /api/clients/{id}`, `POST /api/clients/{id}/activate`, `GET /api/clients/export`, `POST /api/clients/import` — mismo set para `/api/suppliers`

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

`lib/backend-types.ts` define los tipos que devuelve el backend (camelCase, coincide con el JSON de .NET) — incluye `BackendSale`/`BackendBudget`/`BackendClient`/`BackendSupplier`, pero **todavía no** los campos nuevos de precio mayorista (`wholesalePrice`, `priceType`, `discountType`, `discountFixedAmount`, `convertedSaleId`/`convertedAt`); eso sigue pendiente del bloque de Frontend de `specs/presupuestos-precio-mayorista/tasks.md`. `lib/product-mapper.ts` convierte un `BackendProduct` al `Product` (view model) que consumen los componentes de la home (`Productos.tsx`, `Favoritos.tsx`, `ProductoDetalle.tsx`), para no tener que reescribir esos componentes.

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

Todas las páginas admin (`productos`, `categorias`, `ventas`, `presupuestos`, `base-datos/*`, dashboard) llaman a `/api/admin/backend/<recurso>` desde el cliente — nunca llaman al backend directo ni conocen la clave.

### Panel de administración (`app/admin/`)

El panel tiene su propio CSS (`app/admin/admin.css`, cargado desde `app/admin/layout.tsx`) separado de `globals.css` del sitio público.

- **`(protected)/page.tsx`** — Dashboard: ingresos (solo ventas `Paid`), ticket promedio, ranking de productos más vendidos, desglose minorista/mayorista, alerta de reposición de stock, filtro de fecha (3/6/12 meses o rango libre).
- **`(protected)/productos/page.tsx`** — ABM completo: alta/edición con specs y fotos (por URL — la subida real de archivos queda pendiente), filtro por categoría, soft-delete/reactivar. Todavía sin campo de precio mayorista en el formulario.
- **`(protected)/categorias/page.tsx`** — ABM de categorías.
- **`(protected)/ventas/page.tsx`** — listado con filtro por estado, "Nueva venta manual" (elige productos + cantidad, tipo de cliente, medio de pago, estado inicial), cambio de estado, comprobante con PDF.
- **`(protected)/presupuestos/page.tsx`** — igual que Ventas pero sin tocar stock, con fecha de vencimiento. "Convertir en venta" abre un modal para elegir medio de pago y llama a `POST /api/budgets/{id}/convert` (descuenta stock real y abre el comprobante de la `Sale` generada).
- **`(protected)/base-datos/clientes/page.tsx`** y **`(protected)/base-datos/proveedores/page.tsx`** — ABM completo con Personas de Contacto, Campos custom, datos de facturación, import/export Excel.
- **`(protected)/clientes/page.tsx`** — "Consultas" (leads por WhatsApp/email); **sigue con datos mock**, es un módulo aparte de la Base de Datos de Clientes.
- **`(protected)/contenido/page.tsx`** — contenido editable del sitio público (Inspiración, barra de promociones), storage en `DATA_DIR`.
- **`(protected)/configuracion/page.tsx`** — cambio de contraseña, cerrar sesión.
- **`setup/`**, **`login/`** — fuera del route group protegido, para no generar loops de redirect.

### Home pública, ficha de producto y visualizador

- `app/page.tsx` es un Server Component: trae el catálogo y los destacados del backend y se los pasa por props a `app/HomeClient.tsx`.
- `components/sections/Productos.tsx` y `components/sections/Favoritos.tsx` (ex-`SeleccionCarmen.tsx`) reciben los productos por props; ambos usan `components/ui/ProductCard.tsx` (variantes `grid`/`strip`), único componente de tarjeta de producto tras eliminar los duplicados.
- `app/producto/[id]/page.tsx` trae el producto y relacionados (misma categoría) del backend.
- `components/sections/Inspiracion.tsx` (ex-`Lookbook.tsx`) recibe contenido editable desde `/admin/contenido`, ya no usa datos mock. `components/ui/ProductModal.tsx` se eliminó (código muerto, nadie lo importaba).
- Ya no hay imágenes hardcodeadas de Unsplash en ningún lado (ni seed del backend ni `lib/data.ts`); un producto sin fotos reales muestra `components/ui/ImagePlaceholder.tsx`.
- Animaciones con GSAP (`gsap`, `@gsap/react`) en el hero y demás secciones. Carrito, WhatsApp y botón de scroll-to-top persisten en toda la web vía contexto global (`lib/cart.tsx`, `CartDrawerHost.tsx`, `FloatingDock.tsx`).
- `app/visualizador/` — feature nueva: el visitante sube una foto de su espacio y prueba superponer muebles del catálogo (`VisualizadorClient.tsx`), enlazado desde `Header.tsx`.

### Requisitos para correr localmente

```
cd langdeco-frontend
npm install
npm run dev     # necesita el backend corriendo en API_URL
```

---

## Pendiente (no incluido en esta iteración)

1. **UI de precio mayorista y descuento con recargo**: el backend soporta `WholesalePrice`/`PriceType` por línea y `DiscountType` (con recargo) de punta a punta, pero el panel (`productos`, `presupuestos`, `ventas`) todavía no tiene los campos para usarlo, y `lib/backend-types.ts` no refleja esos campos. Ver `specs/presupuestos-precio-mayorista/tasks.md` (bloque "Frontend").
2. **Subida real de fotos de producto**: hoy el ABM de productos guarda URLs escritas a mano. El patrón de upload (`DATA_DIR/uploads` + `GET /api/media/<archivo>`) ya existe en el repo (usado por Contenido/Inspiración) — falta aplicarlo también al formulario de productos.
3. **Despliegue**: no se aprovisionó ninguna infraestructura real. Al desplegar (Coolify + Cloudflare o el esquema que se elija):
   - Definir `AdminApiKey` (backend) = `BACKEND_ADMIN_KEY` (frontend) con un valor aleatorio largo — **si queda vacía, la API admin queda completamente abierta**.
   - Definir `ADMIN_SESSION_SECRET` aleatorio y largo — si falta, la cookie de sesión sería falsificable.
   - El backend .NET debe quedar en red interna, accesible solo desde el contenedor del frontend (no exponer su puerto públicamente).
   - Persistir `DATA_DIR` (contraseña del panel, `site-content.json`, imágenes subidas) en un volumen — sin esto, cada redeploy borra `admin.json` y hay que rehacer el setup.
   - Postgres con su propio volumen persistente.
4. **Consultas (leads)**: sigue siendo un módulo mock, sin backend propio.
