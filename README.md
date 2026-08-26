# LaLang Deco — Panel de administración

E-commerce y panel de gestión para un negocio de decoración. El sitio público muestra el catálogo; el panel `/admin` permite gestionar productos, categorías, ventas, presupuestos, y una base de datos de clientes y proveedores, con comprobantes en PDF e import/export en Excel.

No hay integración de pago online: las ventas se registran manualmente (transferencia, efectivo o WhatsApp).

## Estructura del repo

```
langdeco/
├── backend/            .NET 10 Web API + PostgreSQL (Entity Framework Core)
└── langdeco-frontend/  Next.js (App Router) + React
```

El backend .NET expone la API y vive pensado para quedar en red interna (no expuesto directo en producción). El frontend Next.js hace de frontend público **y** de BFF (backend-for-frontend) para el panel admin: las páginas de `/admin` llaman a rutas propias de Next (`/api/admin/backend/*`) que validan la sesión y reenvían al backend agregando la clave `X-Admin-Key` — el navegador nunca ve la URL interna del backend ni esa clave.

---

## Backend (`backend/`)

### Modelo de datos

- **Category** / **Product**: catálogo, con `Product` soft-delete (`Active`), `WholesalePrice` opcional (debe ser menor al `Price` de lista), specs (ficha técnica) y hasta 6 fotos por producto.
- **Sale** (venta) y **Budget** (presupuesto): comprobantes con numeración correlativa propia por tipo (`Number`, arranca en 1), datos de cliente embebidos (`CustomerInfo`: nombre/contacto/CUIT/domicilio — es la copia impresa en el comprobante, no cambia si el cliente se edita después), bonificación (`DiscountType: Percent|Fixed`, admite negativo = recargo), IVA %, y vínculo opcional `ClientId` a un cliente de la Base de Datos. Cada línea (`SaleItem`/`BudgetItem`) tiene su propio `PriceType` (`Retail`/`Wholesale`) que resuelve contra `Price`/`WholesalePrice` del producto. `Sale` además tiene `Status` (`Pending`/`Paid`/`Cancelled`) y descuenta stock; `Budget` no toca stock y tiene `ValidUntil` (fecha de vencimiento) y `Status` (`Open`/`Converted`/`Expired`/`Cancelled`) — un `Budget` `Open` se puede convertir en `Sale` real (`POST /api/budgets/{id}/convert`, ver sección **Precio mayorista y conversión Presupuesto → Venta**), quedando `Sale.BudgetId`/`Budget.ConvertedSaleId` cruzados.
- **Client** (cliente) y **Supplier** (proveedor): maestros completos con datos de contacto, domicilio, "Personas de Contacto" y "Campos custom" (listas), categoría y descuento general, y datos de facturación (razón social, CUIT, condición de IVA, comprobante por defecto, domicilio fiscal).
- **DocumentCounter**: contador correlativo por tipo de comprobante (`Sale`/`Budget`), incrementado de forma atómica.
- **CompanySettings**: nombre/teléfono/logo de la empresa, usado en el encabezado de los PDF.

Migraciones en `backend/Migrations/`, aplicadas automáticamente al arrancar el backend (`db.Database.Migrate()` en `Program.cs`, corre en todos los entornos). El *seed* de datos de muestra (productos/categorías demo) solo corre en `Development`.

### Reglas de negocio (viven en el backend, no se pueden saltear desde el frontend)

- **Totales siempre recalculados en el servidor**: precio, subtotal, descuento e IVA de una venta/presupuesto nunca se toman de lo que manda el cliente — se recalculan a partir del precio real del producto en la DB.
- **Stock atómico**: se descuenta al vender (`UPDATE ... WHERE Stock >= cantidad`, sin sobreventa por ventas simultáneas) y se repone al cancelar una venta o al editarla (restaura y reaplica).
- **Numeración correlativa**: cada comprobante (Venta o Presupuesto) obtiene su número dentro de la misma transacción de creación, vía un `UPDATE ... RETURNING` sobre `DocumentCounters` — no hay condición de carrera entre altas simultáneas.
- **CUIT**: se valida formato (11 dígitos) + dígito verificador (algoritmo módulo 11 argentino) tanto al guardar un Cliente/Proveedor como en el botón "Verificar" del formulario (este último corre 100% en el navegador, sin llamada al backend).
- **Borrado con integridad referencial**: un Cliente/Proveedor con ventas o presupuestos asociados se desactiva en vez de borrarse (soft-delete); si no tiene ninguno, se elimina de verdad. Borrar un Cliente nunca rompe una venta ya emitida (el comprobante conserva su propia copia de los datos en `CustomerInfo`).
- **Import de Excel sin duplicar**: al reimportar una planilla, matchea filas existentes primero por CUIT y si no hay CUIT por nombre exacto — actualiza en vez de crear un registro nuevo.
- **Seguridad `X-Admin-Key`**: filtro `RequireAdminKey` sobre los endpoints administrativos. Se configura con `AdminApiKey` (backend), que debe coincidir con `BACKEND_ADMIN_KEY` (frontend). La comparación es timing-safe (`AdminKeyComparer`, `CryptographicOperations.FixedTimeEquals`) y **falla cerrada**: si `AdminApiKey` está vacía o no configurada, todo pedido admin se rechaza (antes se saltaba el chequeo por completo con la clave vacía — ya no).
- **Catálogo público** (`GET /api/products`, `GET /api/categories`): sin clave, devuelve solo activos.
- **Validación de producto**: `Name` y `Material` son obligatorios al crear/editar — antes faltaba esta validación puntual y tirar un producto sin esos campos daba un 500 en vez de un 400 con mensaje claro.
- **Consultas** (`InquiriesController`, `POST /api/inquiries`): endpoint público real (sin clave) donde el formulario de contacto del sitio público guarda leads; el panel admin los lee vía `/admin/clientes` — no es un dato de muestra, es el mismo flujo end-to-end.

### Comprobantes en PDF

`backend/Services/ReceiptPdfService.cs` (con [QuestPDF](https://www.questpdf.com/), licencia Community) genera un PDF no fiscal tipo "X" — sello de la empresa, número y fecha, datos del cliente, tabla de conceptos, totales — reutilizado tanto para Ventas como Presupuestos (solo cambia el título y si muestra fecha de vencimiento). Se genera al vuelo en cada request, no se guarda ningún archivo:

- `GET /api/sales/{id}/pdf`
- `GET /api/budgets/{id}/pdf`

Este comprobante **no tiene validez fiscal** (no emite CAE ni se integra con ARCA/AFIP) — sirve como respaldo interno para que el negocio después facture manualmente en su sistema de facturación electrónica.

### Import/export de Excel

`backend/Services/ClientExcelService.cs` y `SupplierExcelService.cs` (con [ClosedXML](https://github.com/ClosedXML/ClosedXML)) arman/leen planillas `.xlsx`:

- `GET /api/clients/export` · `GET /api/suppliers/export` — descarga toda la grilla (una fila por registro, con la primera persona de contacto aplanada en columnas; los campos custom y contactos adicionales no se exportan en este formato simple).
- `POST /api/clients/import` · `POST /api/suppliers/import` — sube un `.xlsx` (`multipart/form-data`), devuelve `{ created, updated, errors }`.

### Endpoints principales

Públicos (sin clave):
- `GET /api/products`, `GET /api/products/{id}`, `GET /api/categories`
- `POST /api/inquiries` — el formulario de contacto del sitio público crea una consulta real (nombre, email, mensaje).

Admin (requieren header `X-Admin-Key`):
- Productos/Categorías: CRUD completo + `activate`/`deactivate`.
- `POST /api/sales`, `GET /api/sales`, `GET /api/sales/{id}`, `PUT /api/sales/{id}`, `PATCH /api/sales/{id}/status`, `GET /api/sales/{id}/pdf`, `GET /api/sales/summary`.
- `POST /api/budgets`, `GET /api/budgets`, `GET /api/budgets/{id}`, `PUT /api/budgets/{id}`, `PATCH /api/budgets/{id}/status`, `POST /api/budgets/{id}/convert`, `GET /api/budgets/{id}/pdf`.
- `POST /api/clients`, `GET /api/clients`, `GET /api/clients/{id}`, `PUT /api/clients/{id}`, `DELETE /api/clients/{id}`, `POST /api/clients/{id}/activate`, `GET /api/clients/export`, `POST /api/clients/import`.
- Mismo set para `/api/suppliers`.
- `GET /api/inquiries` (filtro `?status=`), `PATCH /api/inquiries/{id}/status` — bandeja de "Consultas" del panel (`POST /api/inquiries` es público, ver más abajo).

Documentación interactiva (solo en `Development`): **`/swagger`**.

### Configuración y arranque local

`backend/appsettings.json` (versionado) trae la cadena de conexión y la clave de admin vacías. La configuración real de desarrollo va en `backend/appsettings.Development.json` (gitignored):

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=langdeco;Username=postgres;Password=..."
  }
}
```

Requisitos: **.NET 10 SDK** y **PostgreSQL** con una base `langdeco`. Levantar:

```bash
cd backend
dotnet ef database update    # aplica migraciones (o se aplican solas al arrancar)
dotnet run
```

Por defecto queda en `http://localhost:5279`.

---

## Frontend (`langdeco-frontend/`)

Next.js (App Router). El catálogo público se renderiza con Server Components que consultan el backend directamente (`lib/api.ts`). El panel admin es client-side y habla con el backend a través del proxy `app/api/admin/backend/[...path]/route.ts`.

### Variables de entorno (`.env.local`, no versionado)

```
API_URL=http://localhost:5279       # backend .NET (interno, NO el puerto de Next)
BACKEND_ADMIN_KEY=                  # debe coincidir con AdminApiKey del backend
ADMIN_SESSION_SECRET=...            # aleatorio y largo — firma la cookie de sesión del panel
# ADMIN_PASSWORD=...                # opcional: si se define, se salta /admin/setup
```

Reglas de la contraseña del panel (`/admin/setup` y cambio de contraseña): mínimo 10 caracteres, con al menos una letra y un número (`lib/password-policy.ts`).

### Autenticación del panel

Vive enteramente en el frontend, es solo por contraseña (sin usuario):
- `lib/admin-credentials.ts` — hash PBKDF2, guardado en `data/admin.json` (gitignored).
- `lib/admin-session.ts` — cookie de sesión firmada (HMAC-SHA256), expira a los 7 días.
- Primer ingreso a `/admin` sin contraseña configurada → redirige a `/admin/setup` para definirla. Login limita a 5 intentos fallidos por IP cada 15 minutos.

### Precio mayorista y conversión Presupuesto → Venta

`Product.WholesalePrice` (opcional, debe ser menor al precio de lista) y `PriceType` (`Retail`/`Wholesale`) por línea de `Sale`/`Budget` permiten facturar algunas líneas a precio mayorista dentro del mismo comprobante. `PricingService.ResolveUnitPrice` resuelve el precio según `PriceType` y devuelve 400 si se pide `Wholesale` sobre un producto sin `WholesalePrice`. El descuento/bonificación (`DiscountType: Percent|Fixed`) admite valores negativos para representar un **recargo** en vez de un descuento.

La conversión real de un Presupuesto en Venta es `POST /api/budgets/{id}/convert` (`BudgetConvertDto { PaymentMethod }`): valida que el presupuesto siga `Open` (venciéndolo primero si corresponde), descuenta stock por ítem con rollback si falta alguno, crea la `Sale` con numeración propia y `BudgetId`, y marca el `Budget` como `Converted` con `ConvertedSaleId`/`ConvertedAt`. Si esa `Sale` generada se cancela después, `BudgetLifecycleService.ReopenIfConvertedAsync` reabre el `Budget` a `Open` (salvo que ya haya vencido, en cuyo caso queda `Expired`).

**Estado real de la UI mayorista** (corrige documentación previa desactualizada): el panel **sí** tiene UI mayorista parcial — el formulario de producto tiene el campo "Precio mayorista", y el alta de Venta/Presupuesto tiene un selector Minorista/Mayorista (`ClientType`) que resuelve el precio de todos los ítems del comprobante contra `wholesalePrice` cuando corresponde. `lib/backend-types.ts` refleja `wholesalePrice` y `clientType`/`ClientType`. Lo que **sigue faltando**: el selector es **por documento entero**, no por línea (no se puede mezclar Retail y Wholesale en el mismo comprobante); el descuento solo tiene el campo `discountPercent` (%), sin el toggle de `discountType`/`discountFixedAmount` (monto fijo o recargo) que el backend ya soporta; y no hay ningún indicador visual en la UI de que una Venta viene de un Presupuesto convertido (`convertedSaleId`/`convertedAt` no están en `lib/backend-types.ts` ni se muestran).

### Panel de administración (`app/admin/(protected)/`)

El panel fue rediseñado (CSS propio en `app/admin/admin.css`, cargado desde `app/admin/layout.tsx`, separado de `globals.css` del sitio público).

| Ruta | Qué hace |
|---|---|
| `/admin` | Dashboard: ingresos, ticket promedio, ranking de productos, reposición de stock, filtro de fecha (3/6/12 meses o rango libre vía `?from=&to=` en `GET /api/sales/summary`, filtra por `Sale.CreatedAt`). |
| `/admin/productos` | ABM de productos (specs, fotos por URL, filtro por categoría). |
| `/admin/categorias` | ABM de categorías. |
| `/admin/ventas` | Listado + alta de ventas manuales; al crear una se abre el comprobante (ver/editar/imprimir/exportar PDF). |
| `/admin/presupuestos` | Igual que Ventas pero sin tocar stock, con fecha de vencimiento. "Convertir en venta" abre un modal para elegir medio de pago y llama a `POST /convert` (descuenta stock de verdad y abre el comprobante de la `Sale` generada). |
| `/admin/base-datos/clientes` | ABM de Clientes (todos los campos de contacto y facturación, Personas de Contacto, Campos custom), import/export Excel. |
| `/admin/base-datos/proveedores` | Igual que Clientes, con sección "Compras" en vez de "Ventas". |
| `/admin/clientes` | "Consultas" — bandeja de leads reales del formulario de contacto del sitio público (`Inquiry`/`InquiriesController`, backend real, no datos de muestra), módulo aparte de la Base de Datos de Clientes. |
| `/admin/contenido` | Contenido editable del sitio público: Hero, logotipo, página "Nosotros" (fotos + todos los textos: título, intro, línea de tiempo de 4 hitos, 3 pilares), "Inspiración" (ex-Lookbook), barra de promociones scrolleable. Storage en `DATA_DIR/site-content.json` + `DATA_DIR/uploads` (ver sección **Storage de contenido e imágenes**). |
| `/admin/configuracion` | Cambio de contraseña del panel. |

### Visualizador de espacios (`app/visualizador/`)

Feature del sitio público (no del admin, aunque nació en la misma racha de trabajo): el visitante sube una foto de su espacio y prueba superponer los muebles del catálogo antes de comprar (`VisualizadorClient.tsx`). Enlazado desde `Header.tsx`.

### Storage de contenido e imágenes

El contenido editable del sitio (`site-content.json`) y las imágenes subidas (banner, contenido, fotos de producto) se guardan en disco bajo `DATA_DIR` (`lib/storage.ts`, `lib/media.ts`), servidas por `GET /api/media/[file]`. Es una decisión explícita del usuario mientras no haya credenciales de Cloudflare R2 — el punto de entrada para migrar es `saveUploadedImage()` en `lib/media.ts`; nada más del código depende de dónde vive el archivo físico.

### Frontend público — rediseño con GSAP y carrito global

- Animaciones con GSAP (`gsap`, `@gsap/react`): texto del hero letra por letra con scroll reveal, subrayado por palabra al hover, etc. Los elementos "3D" flotantes del hero/favoritos/inspiración (placeholders 2D con parallax) se sacaron del diseño actual.
- Carrito, botón de WhatsApp y botón de "subir" (scroll to top) persisten en toda la web vía contexto global (`lib/cart.tsx`, `CartDrawerHost.tsx`, `FloatingDock.tsx`), no solo en la home.
- `components/ui/ProductCard.tsx` (variantes `grid`/`strip`) es el único componente de tarjeta de producto — reemplaza duplicados que existían antes en `Productos.tsx` y `Favoritos.tsx`. Incluye botón de WhatsApp por producto y tamaño uniforme.
- `components/ui/ImagePlaceholder.tsx` es el estado de "sin imagen" (ya no hay fotos de stock de Unsplash hardcodeadas en ningún lado — ni en el seed del backend ni en `lib/data.ts`); un producto sin fotos reales muestra este placeholder.
- El catálogo público solo tiene 2 categorías (`mayor` = Piezas Mayores, `tesoro` = Pequeños Tesoros) — no hay categorías por tipo de mueble.

**Comprobante de Venta/Presupuesto** (`components/admin/ReceiptView.tsx`): réplica visual del PDF con dos modos — vista de solo lectura y edición inline (cliente + ítems + bonificación/IVA). Acciones:
- **Imprimir** — abre el PDF en una pestaña nueva y dispara el diálogo de impresión del navegador.
- **Exportar** — descarga el PDF.
- **Editar** — habilita edición (solo mientras el comprobante está `Pending`/`Open`); al guardar se recalcula todo en el servidor.
- Los modales del panel (comprobante, alta de venta/presupuesto/cliente/proveedor) se cierran con **Esc**.

**Selector de cliente guardado**: al crear una Venta o Presupuesto se puede elegir un Cliente ya cargado en la Base de Datos para autocompletar nombre/contacto/CUIT/domicilio (los campos quedan editables igual, no es obligatorio — se puede seguir cargando un cliente ocasional a mano).

### Requisitos para correr localmente

```bash
cd langdeco-frontend
npm install
npm run dev     # necesita el backend corriendo en API_URL
```

---

## Resiliencia del frontend

- `app/error.tsx` — error boundary de nivel raíz con la identidad visual del sitio (Header/Footer, botones "Reintentar"/"Volver al inicio") en vez de la pantalla de error genérica de Next si el backend está caído o tira una excepción.
- `app/not-found.tsx` — 404 con la misma identidad visual.
- `lib/api.ts` tiene timeout (`AbortSignal.timeout`, 8s) en los fetches al backend — si el backend .NET no responde, la página falla rápido con un mensaje claro en vez de colgarse.

## SEO

- `app/sitemap.ts` / `app/robots.ts` — generados dinámicamente (rutas estáticas + productos del catálogo).
- `app/producto/[id]/page.tsx` tiene `generateMetadata()` por producto (título, descripción, Open Graph, Twitter card) en vez de compartir el metadata genérico del sitio, más JSON-LD (`schema.org/Product`) inline.
- `app/layout.tsx` define `metadataBase` (necesario para que las URLs relativas de OG resuelvan bien) y el Open Graph/Twitter por defecto del sitio.
- `lib/site-url.ts` expone `SITE_URL` (env `NEXT_PUBLIC_SITE_URL`, con fallback a `localhost:3000`) — configurar esa variable en producción para que sitemap/OG/JSON-LD usen el dominio real.

## Tests

Cobertura chica pero real de la lógica más riesgosa (precios, stock, conversión), no cobertura exhaustiva de cada controller/componente:

- **Backend** (`backend.Tests/`, xUnit): `PricingServiceTests`, `DocumentTotalsCalculatorTests` (matemática de precio/descuento/IVA, sin DB), `StockServiceTests` (descuento atómico de stock, contra SQLite en memoria real — no el proveedor InMemory de EF, que no soporta `ExecuteUpdateAsync`). Correr con `cd backend.Tests && dotnet test`.
- **Frontend** (Vitest, `lib/**/*.test.ts`): `formatPrice`, `normalize`, `isValidCuit`. Correr con `npm run test`.
- **E2E** (Playwright, `e2e/*.spec.ts`): catálogo + agregar al carrito, home. Requiere el backend y `npm run dev` ya corriendo (no levanta servidores solo). Correr con `npm run test:e2e`.

## Alcance y limitaciones conocidas

- Los comprobantes de Venta/Presupuesto **no son facturas fiscales** (no hay integración con el web service de Factura Electrónica de ARCA/AFIP, no emiten CAE) — son respaldo interno para facturar manualmente después.
- El botón "Verificar" CUIT valida formato y dígito verificador localmente; no consulta el padrón real de ARCA/AFIP.
- "Saldo Inicial" de Cliente/Proveedor es un campo informativo — no hay libro de movimientos ni cuenta corriente.
- El export de Excel solo incluye la primera Persona de Contacto por fila; los Campos custom no se exportan (sí se pueden seguir editando desde el panel).
- Subida de fotos de producto: hoy son URLs escritas a mano, no hay upload de archivos desde la PC (el mecanismo de upload ya existe y se usa en Contenido, solo falta conectarlo al formulario de productos).
- El precio mayorista/`ClientType` está parcialmente en la UI del panel (ver sección **Precio mayorista y conversión Presupuesto → Venta**): falta el toggle por línea, el tipo de descuento con recargo, y mostrar de qué presupuesto salió una venta.
- El "Visualizador de espacios" (`/visualizador`) es una prueba de superposición de muebles sobre una foto subida por el visitante, sin guardado ni backend propio más allá de leer el catálogo.
- Tests: cobertura chica (ver sección **Tests**), no exhaustiva — la mayoría de los controllers/componentes no tienen test propio todavía.

## Seguridad — checklist para producción

1. **`AdminApiKey` (backend) = `BACKEND_ADMIN_KEY` (frontend)**, con un valor aleatorio largo. Ya falla cerrada si queda vacía (ver **Reglas de negocio**), pero sin una clave real el panel admin no es utilizable — igual hay que definirla.
2. **`ADMIN_SESSION_SECRET`** aleatorio y largo — si falta, se usa un valor por defecto inseguro y la cookie de sesión sería falsificable.
3. **Backend en red interna**: exponer públicamente solo el frontend Next.js; el backend .NET debe ser accesible solo desde el contenedor del frontend.
4. Persistir el volumen de Postgres y el directorio `data/` del frontend (contraseña del panel) — sin esto, cada redeploy pierde la base o la contraseña configurada.
5. **`NEXT_PUBLIC_SITE_URL`** con el dominio real de producción — sin esto, sitemap/robots/Open Graph siguen apuntando a `localhost:3000`.
