# Plan técnico — Precio mayorista por línea y conversión real de Presupuesto a Venta

Ver `spec.md` para el detalle de reglas de negocio. Este documento define el orden de implementación y los archivos concretos a tocar, basado en la estructura real del repo.

## Principio de orden

Backend primero y completo (modelo → migración → servicios → controllers), después frontend. La conversión (§3) depende de que el precio por línea (§2) ya exista, porque `Sale.Convert` copia `PriceType` desde `BudgetItem`.

---

## 1. Migración de datos (EF Core)

Una sola migración `AddWholesalePricingAndBudgetConversion` con:

- `Products.WholesalePrice` (`decimal?`, nullable).
- `BudgetItems.PriceType` (`int`, not null, default `0` = Retail — reutiliza el enum `ClientType`).
- `SaleItems.PriceType` (`int`, not null, default `0`).
- `Budgets.DiscountType` (`int`, not null, default `0` = Percent), `Budgets.DiscountFixedAmount` (`decimal`, not null, default `0`).
- `Sales.DiscountType` (`int`, not null, default `0`), `Sales.DiscountFixedAmount` (`decimal`, not null, default `0`).
- `Budgets.ConvertedSaleId` (`int?`, FK a `Sales.Id`, `ON DELETE SET NULL`), `Budgets.ConvertedAt` (`timestamp?`).
- `Sales.BudgetId` (`int?`, FK a `Budgets.Id`, `ON DELETE SET NULL`).

Todos los campos nuevos son opcionales o tienen default, así que **no rompe datos existentes** y no requiere backfill.

Comando:
```
cd backend
dotnet ef migrations add AddWholesalePricingAndBudgetConversion
```
(se aplica sola al arrancar el backend, como ya está configurado en `Program.cs`).

## 2. Backend — modelo y validación

Archivos a modificar:

- `backend/Models/Product.cs` — agregar `WholesalePrice`.
- `backend/Models/BudgetItem.cs` — agregar `PriceType` (tipo `ClientType`, default `Retail`).
- `backend/Models/SaleItem.cs` — agregar `PriceType` (tipo `ClientType`, default `Retail`).
- `backend/Models/Budget.cs` — agregar `DiscountType` (enum nuevo `DiscountType { Percent, Fixed }`), `DiscountFixedAmount`, `ConvertedSaleId`, `ConvertedAt`.
- `backend/Models/Sale.cs` — agregar `DiscountType`, `DiscountFixedAmount`, `BudgetId`.
- `backend/Data/AppDbContext.cs` — configurar la FK `Sale.BudgetId → Budget` y `Budget.ConvertedSaleId → Sale` (relaciones opcionales, sin cascade delete — usar `SetNull` para no romper historial si algún día se permite borrar).
- `backend/Validation.cs` (o donde vivan los helpers de validación existentes) — agregar chequeo `WholesalePrice < Price` cuando no es null.

## 3. Backend — cálculo de totales

- `backend/Services/DocumentTotals.cs` (`DocumentTotalsCalculator.Compute`): cambiar firma para aceptar `DiscountType` y el valor correspondiente (`discountPercent` o `discountFixedAmount`), calculando `DiscountAmount` según el tipo (ver spec §4.1). Mantener la firma vieja como sobrecarga que asume `Percent` **solo si hace falta para no romper otros call sites** — revisar todos los usos (`SalesController`, `BudgetsController`) y actualizarlos directamente en vez de mantener una sobrecarga muerta.

## 4. Backend — resolución de precio por línea

Nuevo método helper (puede vivir en `DocumentTotals.cs` o un nuevo `PricingService.cs`):

```csharp
static decimal ResolveUnitPrice(Product product, ClientType priceType)
{
    if (priceType == ClientType.Wholesale)
    {
        if (product.WholesalePrice is null)
            throw new PricingException($"El producto '{product.Id}' no tiene precio mayorista");
        return product.WholesalePrice.Value;
    }
    return product.Price;
}
```

Usado en:
- `BudgetsController.Create` / `Update` (reemplaza el actual `product.Price` fijo).
- `SalesController.Create` (equivalente, revisar el controller real — no se leyó en esta sesión, buscar el método de alta de venta manual y aplicar el mismo cambio).

La excepción/validación debe traducirse a 400 con mensaje claro (patrón ya usado: `BadRequest(new { error = "..." })`).

## 5. Backend — conversión Presupuesto → Venta

Nuevo método en `BudgetsController` (o extraído a un `BudgetConversionService` si el controller ya es grande — a criterio de quien implemente, dado que `BudgetsController` ya tiene ~240 líneas):

`POST /api/budgets/{id}/convert`, body `{ paymentMethod: PaymentMethod }`.

Lógica (dentro de una transacción, igual patrón que `Create`):
1. Cargar `Budget` con `.Include(b => b.Items)`. 404 si no existe.
2. 400 si `Status != Open`.
3. Para cada `BudgetItem`, chequear stock con el mismo patrón atómico que ya usa la creación de `Sale` (revisar `SalesController` para reusar el `UPDATE ... WHERE Stock >= cantidad` existente — **no reinventar esa parte**, extraerla a un método compartido si hoy está inline en `SalesController.Create`).
4. Si falta stock de cualquier ítem → rollback transacción, 400 con detalle de qué producto no alcanza.
5. Crear `Sale` copiando `ClientId`, `Customer`, `ClientType`, `DiscountType`, `DiscountPercent`, `DiscountFixedAmount`, `TaxRatePercent` desde `Budget`; `Items` copiados desde `BudgetItem` (incluye `PriceType`); `Status = Pending`; `PaymentMethod` del body; `BudgetId = budget.Id`; `Number` vía `_numbering.NextNumberAsync(DocumentType.Sale)`.
6. Recalcular totales de la `Sale` con `DocumentTotalsCalculator.Compute` usando los mismos inputs que el `Budget` (deben coincidir; es una aserción implícita — si no coinciden, hay un bug en el cálculo).
7. `Budget.Status = Converted`, `ConvertedSaleId`, `ConvertedAt = DateTime.UtcNow`.
8. Commit.

## 6. Backend — reconversión al cancelar

En el método `UpdateStatus` de `SalesController` (buscar el equivalente a `BudgetsController.UpdateStatus`), cuando la transición resultante es `→ Cancelled` **y** `sale.BudgetId != null`:
- Cargar el `Budget` asociado.
- Si `Budget.Status == Converted`: `Budget.Status = Open`, `ConvertedSaleId = null`, `ConvertedAt = null`.
- Si `Budget.Status != Converted` (ya está en otro estado por algún motivo), no tocar nada.

No aplicar la reapertura si, al recalcular, `Budget.ValidUntil` ya pasó — en ese caso queda en `Expired` (aplicar el mismo chequeo de §7 antes de decidir el estado final).

## 7. Backend — auto-vencimiento perezoso

En `BudgetsController.GetAll` y `GetById`: antes de mapear a DTO, para cada `Budget` con `Status == Open` y `ValidUntil < DateTime.UtcNow`, marcar `Status = Expired` y `SaveChangesAsync()`. Extraer a un método privado `ExpireIfNeededAsync(Budget)` reusado en ambos endpoints (y en `UpdateStatus`/`Convert` como guarda inicial, para no permitir convertir algo que ya venció).

## 8. Backend — DTOs

Revisar y actualizar (archivos no leídos en esta sesión, ubicar por nombre):
- `backend/Dtos/ProductDtos.cs` — agregar `WholesalePrice`.
- `backend/Dtos/BudgetDtos.cs` — agregar `PriceType` por ítem, `DiscountType`/`DiscountFixedAmount`, `ConvertedSaleId`/`ConvertedAt` en la respuesta.
- `backend/Dtos/SaleDtos.cs` — agregar `PriceType` por ítem, `DiscountType`/`DiscountFixedAmount`, `BudgetId` en la respuesta.
- Nuevo DTO `BudgetConvertDto { PaymentMethod PaymentMethod }` para el body del `POST /convert`.

## 9. Frontend — tipos y API client

- `langdeco-frontend/lib/backend-types.ts` — reflejar todos los campos nuevos de los DTOs (`WholesalePrice`, `PriceType`, `DiscountType`, `DiscountFixedAmount`, `ConvertedSaleId`, `ConvertedAt`, `BudgetId`).
- `langdeco-frontend/lib/api.ts` (o donde esté centralizado el fetch admin) — el proxy catch-all (`app/api/admin/backend/[...path]/route.ts`) no necesita cambios porque reenvía todo tal cual; solo agregar, si existe, algún helper tipado específico para `convert`.

## 10. Frontend — pantallas

- `app/admin/(protected)/productos/page.tsx` — campo "Precio mayorista" opcional + validación en el form (`< Precio`, mensaje inline).
- `app/admin/(protected)/presupuestos/page.tsx` (alta/edición, y el nuevo action "Convertir en venta" en el detalle/`ReceiptView`) — toggle Retail/Wholesale por línea, selector de tipo de descuento (%/monto) admitiendo negativo, botón/modal de conversión con selección de `PaymentMethod`.
- `app/admin/(protected)/ventas/page.tsx` — mismo toggle por línea en el alta manual; en el detalle, si `budgetId` viene seteado, mostrar link "Generada desde Presupuesto N° X" (a `/admin/presupuestos/{budgetId}` o abrir el mismo modal de comprobante).
- `components/admin/ReceiptView.tsx` — si ya muestra el desglose de descuento, actualizar para reflejar `DiscountType` (mostrar "recargo" cuando el monto neto de ajuste sea positivo, "descuento" cuando sea negativo, en vez de asumir siempre descuento).
- Dashboard (`app/admin/(protected)/page.tsx`) — nueva tarjeta con presupuestos activos / próximos a vencer / tasa de conversión, alimentada por un nuevo cálculo en el summary del backend (ver §11) o calculado client-side sobre `GET /api/budgets` si el volumen de datos es bajo (a decidir según cuántos presupuestos maneja la dueña — si son pocos, cliente-side es más simple y no requiere endpoint nuevo).

## 11. Backend — dashboard (opcional, evaluar necesidad real)

Si se decide calcular server-side: agregar a `BudgetsController` un `GET /api/budgets/summary` análogo a `GET /api/sales/summary` que ya existe, con `activeCount`, `expiringSoonCount` (`ValidUntil` ≤ hoy+3, `Status == Open`), `conversionRate`. Si el volumen de presupuestos es bajo, se puede calcular en el frontend sobre el listado ya traído y evitar este endpoint — **decisión a tomar en la implementación**, no bloquea el resto del plan.

## 12. Orden sugerido de ejecución (para `tasks.md`)

1. Migración + modelo (backend).
2. Cálculo de totales extendido + resolución de precio por línea.
3. Endpoints existentes (`products`, `budgets`, `sales` create/update) actualizados para aceptar los campos nuevos.
4. Endpoint de conversión + reconversión al cancelar.
5. Auto-vencimiento perezoso.
6. DTOs + tipos frontend.
7. UI: producto (mayorista), presupuestos (toggle + descuento + convertir), ventas (toggle + link de origen).
8. Dashboard.
9. Prueba manual end-to-end (ver `tasks.md`, sección de verificación).

## 13. Riesgos / puntos de atención

- **`DocumentTotalsCalculator.Compute` cambia de firma** → hay que tocar todos los call sites en el mismo commit, no dejar una versión a medio migrar.
- **Reutilizar `ClientType` como `PriceType`** ahorra un enum duplicado pero acopla dos conceptos distintos (tipo de cliente del documento vs. precio elegido por línea) al mismo tipo — si en el futuro alguno de los dos necesita un tercer valor, hay que separarlos. Aceptado como trade-off consciente para esta fase.
- **No se leyó `SalesController.cs` completo en esta sesión** (solo `Sale.cs`/`SaleItem.cs`) — antes de tocar el alta de venta manual y el chequeo de stock atómico, releer ese controller entero para no duplicar lógica que ya exista con otro nombre.
- **`ReceiptPdfService`**: no debería necesitar cambios de layout, pero si el desglose de descuento en el PDF asume siempre "descuento" (nunca recargo), revisar el texto fijo ahí también.
