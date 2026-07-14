# Contexto del Proyecto - Botica del Alma

Este documento resume los cambios realizados recientemente en el backend y los requisitos para poner en marcha el proyecto.

## Cambios en el Backend (.NET 10)

1. **Migración a PostgreSQL**: Se ha configurado el backend para utilizar **PostgreSQL** como base de datos principal.
2. **Configuración de Conexión**: La cadena de conexión está configurada en `backend/appsettings.json` apuntando a `localhost:5432` con la base de datos `boticadelalma`.
3. **Migraciones Automáticas**: Al iniciar el backend en modo `Development`, el sistema aplica automáticamente las migraciones pendientes y ejecuta un **Seed** (carga de datos inicial) si la base de datos está vacía.
4. **CORS**: Se ha habilitado una política de CORS para permitir peticiones desde el frontend (`http://localhost:3000`).
5. **Autenticación Admin**: Se han implementado las bases para la gestión de administración, incluyendo middleware y rutas de API para setup y login. (Ver sección **Autenticación del Panel Admin** más abajo para el detalle de configuración.)
6. **Seguridad de la API (X-Admin-Key)**: Los endpoints administrativos del backend (crear/editar/eliminar productos y categorías, ver/cambiar órdenes, ver/eliminar reseñas) exigen el header `X-Admin-Key`. (Ver sección **Reglas de negocio y seguridad del panel**.)

## Reglas de negocio y seguridad del panel

Estas reglas viven en el **backend .NET** (son la fuente de verdad; no se pueden saltear desde el frontend):

- **Seguridad de endpoints (`X-Admin-Key`)**: filtro `RequireAdminKey` (`backend/Attributes/`) sobre los endpoints admin. El frontend envía el header server-side desde `src/lib/api.ts`. Se configura con `AdminApiKey` (backend) que debe coincidir con `BACKEND_ADMIN_KEY` (frontend). **Si `AdminApiKey` está vacía no se exige nada** (modo desarrollo); en producción es obligatorio definirla. Endpoints públicos (catálogo, crear orden, dejar reseña) no requieren clave.
- **Precios anti-manipulación**: al crear una orden, el backend ignora el precio/nombre que manda el cliente y toma el **precio y nombre reales del producto en la DB**. El total se recalcula en el servidor.
- **Estado inicial anti-manipulación**: el checkout público **siempre** crea la orden en `pending`; el backend ignora cualquier `status` enviado por un cliente sin `X-Admin-Key`. Solo el panel (ventas manuales, con la clave admin) puede fijar el estado inicial, y únicamente a `pending` o `paid`. Esto evita que un visitante marque su propia orden como pagada sin pagar.
- **Stock**: el modelo `Product` tiene `Stock` (migración `AddProductStock`). Se descuenta al crear la orden, se **repone al cancelar**, y se rechaza la venta si no hay stock suficiente (tanto en checkout público como en ventas manuales).
- **Máquina de estados de órdenes**: transiciones permitidas `pending → paid → shipped` y cancelación desde `pending`/`paid`. `shipped` y `cancelled` son estados finales. Transiciones inválidas devuelven 400.
- **Reseñas verificadas**: solo se puede reseñar un producto que pertenezca a la orden indicada, la orden no debe estar cancelada, y el autor se fija desde el cliente real de la orden (anti-suplantación). Una reseña por (orden, producto).
- **Borrado de productos**: si el producto tiene ventas registradas se **desactiva** (soft-delete, conserva el historial); si no tiene ventas se elimina de verdad (y se limpian sus reseñas). Las categorías con productos no se pueden eliminar.
- **Validaciones**: el ID de producto/categoría debe ser un slug (`minúsculas-números-guiones`); el precio original (tachado) debe ser mayor que el precio; precio y stock no negativos.
- **Inactivos en el panel**: el catálogo público muestra solo activos; el panel admin pide `includeInactive=true` para poder ver y reactivar productos/categorías desactivados.

Funcionalidades del panel (frontend):
- **Dashboard**: la facturación (ingresos, ticket promedio, gráfico mensual y rankings) cuenta solo órdenes cobradas (`paid`/`shipped`). Incluye un panel de **Reposición de stock** que lista los productos activos agotados o por agotarse (≤ 3 unidades) para saber qué reponer.
- **Ventas manuales**: desde *Órdenes → "Nueva venta manual"* se cargan ventas por WhatsApp/presenciales (toma precios del catálogo y descuenta stock).
- **Configuración**: `/admin/configuracion` permite cambiar la contraseña del panel.
- **Login**: limita a 5 intentos fallidos por IP cada 15 minutos. La sesión expira a los 7 días.
- **Fotos de productos**: hasta 6 por producto, subidas desde la PC (`/admin/productos`). La web muestra **solo las cargadas** (sin slots vacíos); la primera es la portada. Regla validada en el backend: rechaza (400) si hay fotos vacías o más de 6.
- **Banner / Apariencia**: `/admin/apariencia` permite subir la imagen de fondo del banner principal (los botones/textos no cambian).

## Despliegue (Coolify + Cloudflare + DonWeb)

El estado escribible del frontend (contraseña del panel, configuración de la tienda y **fotos subidas** del banner y de productos) se guarda en disco bajo un directorio configurable por la env **`DATA_DIR`** (`src/lib/storage.ts`). Las imágenes subidas van a `DATA_DIR/uploads` y se sirven por `GET /api/media/<archivo>` (no por `/public`, que se hornea en la imagen Docker).

- **Coolify — frontend (Next.js)**: agregar un **Persistent Storage** montado en `/app/data` y definir `DATA_DIR=/app/data`. Sin esto, cada redeploy borra la contraseña del panel (`admin.json`), la configuración (`site-settings.json`) y las fotos subidas. Otras envs: `API_URL` (URL interna del backend .NET), `BACKEND_ADMIN_KEY` (= `AdminApiKey` del backend), `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL` (dominio público real, para SEO — ver sección **SEO y metadatos**).
- **Coolify — backend (.NET)**: definir `AdminApiKey` (= `BACKEND_ADMIN_KEY` del frontend) y la cadena de conexión a la base Postgres (otro servicio de Coolify con su propio volumen).
- **Cloudflare**: `/api/media/*` responde con `Cache-Control: immutable` (el filename es único → una foto nueva es otra URL, no quedan cacheadas viejas). `/api/site-settings` va con `no-store` para que un cambio de banner se vea al instante. Máx 6 MB por imagen. No usar reglas "Cache Everything" sobre `/api/*` ni `/admin/*`.
- **DonWeb**: solo el dominio → DNS apuntando a Cloudflare, y Cloudflare al server de Coolify. Sin impacto en la app.

### Seguridad — checklist OBLIGATORIO en producción

Estas son configuraciones de despliegue (no de código) sin las cuales la API queda expuesta:

1. **`AdminApiKey` (backend) = `BACKEND_ADMIN_KEY` (frontend)**, con un valor aleatorio largo. Si queda vacía, **cualquiera que llegue al backend puede leer todas las órdenes (datos personales), cambiar estados y crear/borrar productos, categorías y reseñas**. CORS NO protege (es del navegador; un atacante usa `curl`).
2. **Backend en red interna**: en Coolify, exponer públicamente **solo** el frontend Next.js. El backend .NET debe ser accesible **solo** desde el contenedor de Next (no publicar su puerto). Así los endpoints públicos/admin no se pueden atacar directo.
3. **`ADMIN_SESSION_SECRET`** aleatorio y largo. Si falta, se usa un default conocido y se podría **falsificar la cookie de sesión** del admin.
4. **Migraciones**: ahora se aplican solas al arrancar el backend (dev y prod), así que la base se actualiza sola en cada deploy.
5. **Cloudflare** como defensa de borde: activar **Rate Limiting** y **Bot Fight Mode** sobre `/api/orders` y `/api/comments` para frenar spam/agotamiento de stock a escala.

Protecciones ya implementadas en el código (defensa en profundidad): descuento de stock **atómico** (sin sobreventa por compras simultáneas), **rate limiting** por IP en crear orden (8/min) y reseña (5/min), checkout que nunca define estado ni confía en precios del cliente, reseñas verificadas contra la orden real, y anti open-redirect en el login.

## Mercado Pago (Checkout Pro)

El cobro con tarjeta / dinero en cuenta usa **Checkout Pro** (redirección a Mercado Pago). La lógica ya está implementada y se **activa sola** cuando se define el Access Token; mientras esté vacío, la web funciona igual y las órdenes se pagan por **transferencia** (los datos bancarios se muestran en el comprobante y en el mail).

**Flujo:** el cliente confirma la orden → el backend crea una *preferencia* en Mercado Pago y devuelve `initPoint` → el frontend redirige al checkout de MP → tras pagar, el cliente vuelve a `/carrito?status=...&orderId=...` → Mercado Pago avisa el pago por **webhook** → el backend valida el pago contra la API de MP y marca la orden como `paid` (y manda el mail de pago confirmado).

**Dónde está el código:**
- `backend/Controllers/OrdersController.cs → TryGenerateMercadoPagoPreference` (crea la preferencia).
- `backend/Controllers/PaymentsController.cs` (recibe y valida el webhook).
- `src/app/api/payments/mercadopago-webhook/route.ts` (proxy: MP notifica al frontend público y este reenvía al backend interno).
- `src/app/carrito/page.tsx` (redirige a `initPoint` y procesa el regreso).

**Configuración (backend):**
- `MercadoPago:AccessToken` — Access Token del **vendedor** (la clienta). Vacío = MP desactivado. En producción, definir por env var: `MercadoPago__AccessToken=APP_USR-...`.
- `SiteUrl` — URL pública del frontend (para `back_urls` y `notification_url`). En prod: `https://tudominio.com`.

**Importante:** `back_urls` y el webhook deben ser **URLs públicas HTTPS**. En `localhost` el checkout redirige, pero Mercado Pago no puede llamar al webhook ni al `auto_return` (para probar el webhook en local se necesita una URL pública tipo ngrok). En producción, con `SiteUrl` = dominio real, funciona de punta a punta. El webhook entra por el frontend porque el backend .NET está en red interna.

**Qué debe hacer la clienta:** crear/usar su cuenta de Mercado Pago (vendedor) → *Tu negocio → Configuración → Gestión y administración → Tus integraciones* → crear una aplicación (tipo *Pagos online / Checkout Pro*) → copiar el **Access Token de producción** (`APP_USR-...`) y pasarlo para pegarlo en `MercadoPago:AccessToken`. Con eso queda cobrando.

## SEO y metadatos

La web genera automáticamente los metadatos que necesitan Google y las redes (previews de WhatsApp/Instagram/Facebook). Todo se arma con las convenciones de archivos de Next.js (App Router):

- **Favicon / ícono**: `src/app/icon.jpg` y `src/app/apple-icon.jpg` (copias del logo). Aparecen en la pestaña del navegador y al guardar la web en iOS.
- **OG / Twitter image**: `src/app/opengraph-image.tsx` genera una imagen de marca **1200×630** al vuelo (crema + verde + oro, sin depender de assets externos). `src/app/twitter-image.tsx` reutiliza la misma. Es lo que se ve al compartir un link de la web.
- **Sitemap**: `src/app/sitemap.ts` → `/sitemap.xml` dinámico: páginas fijas + un `<url>` por cada **producto y categoría activos** (los trae del backend en cada request).
- **robots.txt**: `src/app/robots.ts` permite indexar todo salvo `/admin`, `/api`, `/carrito` y `/favoritos`; apunta al sitemap.
- **Metadata global**: en `src/app/layout.tsx` (`metadataBase`, Open Graph, Twitter card, keywords, canonical).

**Configuración (frontend):**
- `NEXT_PUBLIC_SITE_URL` — dominio público real (ej: `https://laboticadelalma.com`). Lo usan `metadataBase`, el sitemap, el robots y las OG images para generar URLs absolutas. Está centralizado en `src/lib/site.ts`. **Si no se define, se usa un dominio placeholder**; hay que setearlo en producción con el dominio verdadero para que las URLs del sitemap y las previews sean correctas.

> Los metadatos se validan en cada `next build` (las rutas `/opengraph-image`, `/sitemap.xml` y `/robots.txt` se generan en el build). No hace falta mantenerlos a mano.

## Autenticación del Panel Admin (Next.js)

El login del panel (`/admin/login`) vive en el **frontend** (Next.js), no en el backend .NET. Su lógica está en:
- `src/app/api/admin/auth/route.ts` — validación de contraseña y cookie de sesión.
- `src/app/api/admin/setup/route.ts` — configuración inicial de la contraseña.
- `src/lib/admin-credentials.ts` — hash PBKDF2 y guardado en `data/admin.json`.

**Cómo decide qué pantalla mostrar:**
```
setupRequired = no existe data/admin.json  Y  no hay ADMIN_PASSWORD
```
- Si `setupRequired` es `true`, el login redirige a `/admin/setup` (pantalla de "configuración por única vez", pensada para que la clienta defina su propia contraseña).
- Si hay `ADMIN_PASSWORD` definida, se entra directo con esa contraseña y la pantalla de setup queda deshabilitada.

**Para desarrollo**, definir en `.env.local` del frontend (no se sube al repo):
```
API_URL=http://localhost:5066          # URL del backend .NET (NO el puerto de Next)
ADMIN_PASSWORD=tu_contraseña_temporal
ADMIN_SESSION_SECRET=un_string_aleatorio_largo
BACKEND_ADMIN_KEY=                      # vacío en dev = sin exigencia
```
Reiniciar el dev server después de cambiar `.env.local` (Next.js solo lee estas variables al arrancar).

> Importante: `API_URL` debe apuntar al backend (`:5066`), no al propio Next (`:3000`); si apunta a Next, ninguna llamada al backend funciona.

**Para producción / entrega a la clienta**:
1. **Contraseña del panel** — dos opciones:
   - Dejar que la clienta la configure: NO definir `ADMIN_PASSWORD`; en su primer ingreso la define en `/admin/setup` (se guarda en `data/admin.json`). Después puede cambiarla en `/admin/configuracion`.
   - Entregarla ya definida: dejar `ADMIN_PASSWORD` con la clave acordada.
2. **Clave de la API** — definir `AdminApiKey` en el backend (env var o `appsettings`) **igual** a `BACKEND_ADMIN_KEY` del frontend, con un valor aleatorio largo. Sin esto, los endpoints admin del backend quedan abiertos.
3. **Secreto de sesión** — definir `ADMIN_SESSION_SECRET` con un valor aleatorio largo (si no, se usa un default inseguro y el token sería falsificable).

> Nota: `data/admin.json` está en `.gitignore` y no se versiona.

## Requisitos para el Equipo

Para que el backend funcione localmente, cada integrante debe:

1. **Instalar .NET 10 SDK**.
2. **Instalar PostgreSQL**:
   - Crear una base de datos llamada `boticadelalma`.
   - Asegurarse de que el usuario `postgres` tenga la contraseña `200427` (o actualizarla en `appsettings.json`).
3. **Correr el Backend**:
   - Se puede usar el comando `npm run backend` desde la raíz del proyecto (requiere tener `dotnet` instalado).
   - O manualmente: `cd backend && dotnet run --launch-profile http`.

## Otros Cambios
- Se eliminó la integración previa con Prisma/SQLite para centralizar la lógica en la API de .NET.
- Se agregaron hooks (`useApiData`) para facilitar el consumo de la API desde el frontend.
