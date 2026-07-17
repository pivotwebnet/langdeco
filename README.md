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

- **Category** / **Product**: catálogo, con `Product` soft-delete (`Active`), specs (ficha técnica) y hasta 6 fotos por producto.
- **Sale** (venta) y **Budget** (presupuesto): comprobantes con numeración correlativa propia por tipo (`Number`, arranca en 1), datos de cliente embebidos (`CustomerInfo`: nombre/contacto/CUIT/domicilio — es la copia impresa en el comprobante, no cambia si el cliente se edita después), bonificación %, IVA %, y vínculo opcional `ClientId` a un cliente de la Base de Datos. `Sale` además tiene `Status` (`Pending`/`Paid`/`Cancelled`) y descuenta stock; `Budget` no toca stock y tiene `ValidUntil` (fecha de vencimiento) y `Status` (`Open`/`Converted`/`Expired`/`Cancelled`).
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
- **Seguridad `X-Admin-Key`**: filtro `RequireAdminKey` sobre los endpoints administrativos. Se configura con `AdminApiKey` (backend), que debe coincidir con `BACKEND_ADMIN_KEY` (frontend). **Si `AdminApiKey` está vacía no se exige nada** (solo pensado para desarrollo local); en producción es obligatorio definirla.
- **Catálogo público** (`GET /api/products`, `GET /api/categories`): sin clave, devuelve solo activos.

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

Admin (requieren header `X-Admin-Key`):
- Productos/Categorías: CRUD completo + `activate`/`deactivate`.
- `POST /api/sales`, `GET /api/sales`, `GET /api/sales/{id}`, `PUT /api/sales/{id}`, `PATCH /api/sales/{id}/status`, `GET /api/sales/{id}/pdf`, `GET /api/sales/summary`.
- `POST /api/budgets`, `GET /api/budgets`, `GET /api/budgets/{id}`, `PUT /api/budgets/{id}`, `PATCH /api/budgets/{id}/status`, `GET /api/budgets/{id}/pdf`.
- `POST /api/clients`, `GET /api/clients`, `GET /api/clients/{id}`, `PUT /api/clients/{id}`, `DELETE /api/clients/{id}`, `POST /api/clients/{id}/activate`, `GET /api/clients/export`, `POST /api/clients/import`.
- Mismo set para `/api/suppliers`.

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

### Autenticación del panel

Vive enteramente en el frontend, es solo por contraseña (sin usuario):
- `lib/admin-credentials.ts` — hash PBKDF2, guardado en `data/admin.json` (gitignored).
- `lib/admin-session.ts` — cookie de sesión firmada (HMAC-SHA256), expira a los 7 días.
- Primer ingreso a `/admin` sin contraseña configurada → redirige a `/admin/setup` para definirla. Login limita a 5 intentos fallidos por IP cada 15 minutos.

### Panel de administración (`app/admin/(protected)/`)

| Ruta | Qué hace |
|---|---|
| `/admin` | Dashboard: ingresos, ticket promedio, ranking de productos, reposición de stock. |
| `/admin/productos` | ABM de productos (specs, fotos por URL, filtro por categoría). |
| `/admin/categorias` | ABM de categorías. |
| `/admin/ventas` | Listado + alta de ventas manuales; al crear una se abre el comprobante (ver/editar/imprimir/exportar PDF). |
| `/admin/presupuestos` | Igual que Ventas pero sin tocar stock, con fecha de vencimiento. |
| `/admin/base-datos/clientes` | ABM de Clientes (todos los campos de contacto y facturación, Personas de Contacto, Campos custom), import/export Excel. |
| `/admin/base-datos/proveedores` | Igual que Clientes, con sección "Compras" en vez de "Ventas". |
| `/admin/clientes` | "Consultas" — bandeja de leads de contacto (WhatsApp/email), módulo aparte, con datos de muestra. |
| `/admin/configuracion` | Cambio de contraseña del panel. |

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

## Alcance y limitaciones conocidas

- Los comprobantes de Venta/Presupuesto **no son facturas fiscales** (no hay integración con el web service de Factura Electrónica de ARCA/AFIP, no emiten CAE) — son respaldo interno para facturar manualmente después.
- El botón "Verificar" CUIT valida formato y dígito verificador localmente; no consulta el padrón real de ARCA/AFIP.
- "Saldo Inicial" de Cliente/Proveedor es un campo informativo — no hay libro de movimientos ni cuenta corriente.
- El export de Excel solo incluye la primera Persona de Contacto por fila; los Campos custom no se exportan (sí se pueden seguir editando desde el panel).
- La sección "Consultas" (`/admin/clientes`) sigue con datos de muestra, sin conectar a un backend real — es un módulo aparte de la Base de Datos de Clientes.
- Subida de fotos de producto: hoy son URLs escritas a mano, no hay upload de archivos desde la PC.

## Seguridad — checklist para producción

1. **`AdminApiKey` (backend) = `BACKEND_ADMIN_KEY` (frontend)**, con un valor aleatorio largo. Si queda vacía, cualquiera que llegue al backend puede leer y modificar todo (ventas, clientes, datos fiscales).
2. **`ADMIN_SESSION_SECRET`** aleatorio y largo — si falta, se usa un valor por defecto inseguro y la cookie de sesión sería falsificable.
3. **Backend en red interna**: exponer públicamente solo el frontend Next.js; el backend .NET debe ser accesible solo desde el contenedor del frontend.
4. Persistir el volumen de Postgres y el directorio `data/` del frontend (contraseña del panel) — sin esto, cada redeploy pierde la base o la contraseña configurada.
