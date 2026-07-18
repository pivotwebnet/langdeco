# Tasks — Precio mayorista por línea y conversión real de Presupuesto a Venta

Checklist ejecutable. Cada tarea referencia la sección de `plan.md` de donde sale. Pensado para ir tildando en orden; los bloques de Backend deben cerrarse antes de arrancar Frontend (la UI depende de los DTOs finales).

## Backend — modelo y migración

- [x] Agregar `Product.WholesalePrice` (`decimal?`) (`Models/Product.cs`).
- [x] Agregar enum `DiscountType { Percent, Fixed }` (`Models/DiscountType.cs`, archivo nuevo).
- [x] Agregar a `Budget`: `DiscountType`, `DiscountFixedAmount`, `ConvertedSaleId`, `ConvertedAt`.
- [x] Agregar a `Sale`: `DiscountType`, `DiscountFixedAmount`, `BudgetId`.
- [x] Agregar `PriceType` (tipo `ClientType`, default `Retail`) a `BudgetItem` y `SaleItem`.
- [x] Configurar en `AppDbContext.cs` las FKs `Sale.BudgetId → Budget.Id` y `Budget.ConvertedSaleId → Sale.Id` (delete behavior `SetNull`).
- [x] Generar migración `AddWholesalePricingAndBudgetConversion`. **Nota:** el `.cs` generado traía `defaultValue: ""` para las columnas `DiscountType`/`PriceType` (EF Core no propaga el default del enum a través del converter al generar la migración) — se corrigió a mano a `"Percent"`/`"Retail"` antes de aplicar, si no las filas existentes hubieran quedado con un string vacío que rompe la deserialización del enum.
- [x] Validación `WholesalePrice < Price` cuando no es null, en el alta/edición de producto.
- [x] Migración aplicada (`dotnet ef database update`) contra la base local `langdeco`.

## Backend — cálculo y precio por línea

- [x] `DocumentTotalsCalculator.Compute` acepta `DiscountType` + `discountPercent`/`discountFixedAmount` y calcula `DiscountAmount` según corresponda.
- [x] Actualizados los call sites (`BudgetsController.Create/Update/Convert`, `SalesController.Create/Update`).
- [x] `PricingService.ResolveUnitPrice(product, priceType)` (`Services/PricingService.cs`) — devuelve `Price` o `WholesalePrice`, lanza `PricingException` si se pide `Wholesale` sin `WholesalePrice`.
- [x] Usado en `BudgetsController.BuildItemsAsync` y `SalesController.BuildItemsAsync`.
- [x] Traducido a 400 con mensaje claro en ambos controllers.

## Backend — conversión Presupuesto → Venta

- [x] `StockService` (`Services/StockService.cs`) — `TryDecrementAsync`/`IncrementAsync` atómicos, compartido entre `SalesController` y `BudgetsController.Convert` (antes estaba inline solo en `SalesController`).
- [x] `BudgetLifecycleService.ExpireIfNeededAsync` (una entidad y una lista) — usado en `GetAll`, `GetById`, `UpdateStatus` y `Convert`.
- [x] `BudgetConvertDto { PaymentMethod PaymentMethod }`.
- [x] `POST /api/budgets/{id}/convert` implementado: valida `Open` (expirando primero si corresponde), descuenta stock por ítem con rollback si falta alguno, crea `Sale` con `Number` propio y `BudgetId`, setea `ConvertedSaleId`/`ConvertedAt`.
- [x] `BudgetLifecycleService.ReopenIfConvertedAsync` — en `SalesController.UpdateStatus`, al cancelar una venta con `BudgetId`, reabre el `Budget` a `Open` salvo que ya haya vencido (en ese caso queda `Expired`).

## Backend — DTOs

- [x] `ProductDtos.cs` — `WholesalePrice` en `ProductDto` y `ProductUpsertDto`.
- [x] `BudgetDtos.cs` — `PriceType` por ítem, `DiscountType`/`DiscountFixedAmount`, `ConvertedSaleId`/`ConvertedAt`, `BudgetConvertDto`.
- [x] `SaleDtos.cs` — `PriceType` por ítem, `DiscountType`/`DiscountFixedAmount`, `BudgetId`.

## Backend — verificación antes de pasar a frontend

- [x] `dotnet build` sin errores (0 warnings, 0 errors).
- [x] Probado contra el backend local corriendo (`http://localhost:5279`, sin Swagger — se usaron requests directos con `fetch` desde Node por rapidez, cubre lo mismo que Swagger):
  - [x] Crear producto con `WholesalePrice` menor al precio → 200. Con `WholesalePrice` mayor → 400.
  - [x] Crear presupuesto con una línea `PriceType=Wholesale` sobre un producto sin `WholesalePrice` → 400.
  - [x] Crear presupuesto válido con línea Wholesale y descuento `Fixed` negativo (recargo, ya que `DiscountAmount` negativo aumenta el total) → total correcto (verificado: subtotal 124600, discountFixedAmount -1000 → total 125600).
  - [x] Convertir un presupuesto `Open` con stock suficiente → crea `Sale` (total idéntico al `Budget`, 193842), descuenta stock (15→13), `Budget.Status = Converted`.
  - [x] Convertir un presupuesto con stock insuficiente (cantidad 1000) → 400 "Stock insuficiente", stock sin cambios, `Budget` sigue `Open`.
  - [x] Cancelar la `Sale` generada → stock repuesto (13→15), `Budget` vuelve a `Open` con `ConvertedSaleId=null`.
  - [x] Presupuesto con `ValidUntil` en el pasado → al hacer `GET`, aparece como `Expired`, y `convert` sobre él → 400.
  - [x] (Extra) Venta manual directa con `PriceType=Wholesale` → toma el precio mayorista correctamente.
  - [x] (Extra) PDF de venta y de presupuesto siguen generándose (200, `application/pdf`) sin cambios de diseño.

## Frontend — tipos y cliente

- [ ] `lib/backend-types.ts` — reflejar todos los campos nuevos de los DTOs.
- [ ] Confirmar que el proxy `app/api/admin/backend/[...path]/route.ts` no necesita cambios (reenvío genérico) — solo verificar, no debería requerir edición.

## Frontend — Productos

- [ ] Campo "Precio mayorista" (opcional) en el form de alta/edición de producto, con validación en vivo (`< Precio`).

## Frontend — Presupuestos

- [ ] Toggle Retail/Wholesale por línea en el alta/edición de presupuesto — deshabilitado con tooltip si el producto no tiene `WholesalePrice`.
- [ ] Selector de tipo de descuento (%/monto) que admite negativo (recargo) — decidir UX (un campo con signo vs. dos campos separados Descuento/Recargo, ver `plan.md` §6, nota de UI).
- [ ] Botón "Convertir en venta" en el detalle, visible solo si `Status == Open`, abre modal para elegir `PaymentMethod` y confirma contra `POST /convert`.
- [ ] Tras convertir, mostrar link/redirect a la `Sale` generada.

## Frontend — Ventas

- [ ] Toggle Retail/Wholesale por línea en el alta manual de venta (mismo componente que en Presupuestos si se puede compartir).
- [ ] En el detalle de una venta con `budgetId` no nulo, mostrar "Generada desde Presupuesto N° X" con link.

## Frontend — Comprobante PDF / ReceiptView

- [ ] Revisar `components/admin/ReceiptView.tsx`: si el desglose de descuento asume siempre "descuento", actualizar el texto para reflejar recargo cuando corresponda.
- [ ] Revisar `ReceiptPdfService.cs` (backend) por el mismo motivo, si el PDF tiene un texto fijo tipo "Descuento".

## Frontend — Dashboard

- [ ] Decidir si el cálculo de "presupuestos activos / próximos a vencer / tasa de conversión" va server-side (`GET /api/budgets/summary`, nuevo) o client-side sobre el listado ya existente (`GET /api/budgets`) — evaluar volumen real de datos antes de construir un endpoint que capaz no hace falta.
- [ ] Implementar la tarjeta elegida en el dashboard.

## Verificación final end-to-end (manual, en el navegador)

- [ ] Flujo completo: crear producto con mayorista → crear presupuesto con línea mayorista y descuento con recargo → descargar PDF del presupuesto (verificar que el total y el desglose son correctos) → convertir a venta → verificar que el stock bajó y el PDF de la venta coincide con el del presupuesto → cancelar la venta → verificar que el stock volvió y el presupuesto está `Open` de nuevo.
- [ ] Probar el caso de presupuesto vencido: cambiar `ValidUntil` a una fecha pasada directo en la DB (o esperar), listar presupuestos, confirmar que aparece `Expired` y que "Convertir en venta" ya no está disponible.
