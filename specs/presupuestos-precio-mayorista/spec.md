# Spec — Precio mayorista por línea y conversión real de Presupuesto a Venta

**Tipo:** Épica (incremento sobre funcionalidad existente)
**Proyecto:** LasLangDeco — panel admin
**Stack:** .NET 10 (backend) · Next.js (frontend admin) · PostgreSQL
**Estado:** Aprobado para pasar a `plan.md` / `tasks.md`
**Reemplaza a:** el spec borrador "Presupuestos, Ventas y Comprobantes PDF" — ese spec asumía que Presupuestos no existían; en realidad se agregaron en el commit `da417aa` (2026-07-16) con un diseño distinto. Este documento parte del código real y especifica solo el delta.

---

## 0. Qué ya existe (no se toca, se documenta para que no se reconstruya)

Verificado directamente en `backend/Models/`, `backend/Controllers/`, `backend/Services/` (no en los `.md`, que están desactualizados):

- **`Budget`/`BudgetItem`**: presupuesto con cliente (`Client`/`CustomerInfo` embebido), `ClientType` a nivel presupuesto (no por línea), `DiscountPercent`/`TaxRatePercent`, `ValidUntil`, numeración propia (`Number`).
- **Estados de `Budget`**: `Open → Converted | Expired | Cancelled` (4 estados, transiciones validadas en `BudgetsController`).
- **`Sale`/`SaleItem`**: mismo patrón, con `SaleStatus` (`Pending/Paid/Cancelled`) y `PaymentMethod`.
- **Numeración correlativa** (`DocumentCounter` + `DocumentNumberingService.NextNumberAsync`, vía `UPDATE ... RETURNING`) — series independientes para `Sale` y `Budget`. **No requiere cambios.**
- **PDF** (`ReceiptPdfService`, QuestPDF) — ya genera comprobante tipo "X" no fiscal para ambos tipos de documento (`GET /api/budgets/{id}/pdf`, `GET /api/sales/{id}/pdf`). **No requiere cambios de diseño en esta épica.**
- **Cálculo de totales** (`DocumentTotalsCalculator.Compute`) — aplica descuento sobre subtotal, IVA sobre neto. **Se extiende, no se reescribe** (ver §2).
- **`X-Admin-Key`** protege todos los endpoints de este módulo. Sin cambios.

## 1. Resumen ejecutivo

Dos gaps reales sobre lo ya construido:

1. **No hay precio mayorista por producto ni por línea.** `ClientType` existe a nivel de todo el presupuesto/venta, pero es informativo — no cambia qué precio se cobra. Se necesita que la dueña pueda elegir, **ítem por ítem**, si cobra precio normal o mayorista, tanto en Presupuestos como en Ventas manuales.
2. **La conversión Presupuesto → Venta no existe de verdad.** Hoy `PATCH /api/budgets/{id}/status` con `status=Converted` solo cambia el campo `Status` — no crea una `Sale`, no descuenta stock, no copia ítems. Hay que construir esa lógica completa.

Además, se extiende el descuento actual para permitir **recargo** (valor negativo) y **monto fijo** (no solo porcentaje), sin tocar el IVA (que sigue siendo un concepto aparte, como ya está).

## 2. Alcance

### 2.1 Dentro de alcance

- `Product.WholesalePrice: decimal?` — precio mayorista opcional.
- `PriceType` por línea en `BudgetItem` **y** `SaleItem` (decisión: aplica a ambos, para que una venta manual directa también pueda usar precio mayorista por ítem sin pasar por un presupuesto).
- Extensión del descuento: `DiscountType` (`Percent` | `Fixed`) + soporte de valores negativos en `Percent` (recargo) en `Budget` y `Sale`.
- `POST /api/budgets/{id}/convert` — conversión real: crea `Sale`, descuenta stock, copia ítems y ajustes, enlaza `Budget.ConvertedSaleId`/`Sale.BudgetId`.
- Reconversión: si la `Sale` generada por una conversión se cancela después, el `Budget` de origen vuelve a `Open` (queda convertible de nuevo).
- Auto-vencimiento perezoso: al leer/listar un `Budget` en estado `Open` con `ValidUntil` pasado, se marca `Expired` antes de devolverlo.
- Pantallas admin: toggle Retail/Wholesale por línea (en Presupuestos y en Ventas manuales), campo `WholesalePrice` en el alta/edición de producto, botón "Convertir en venta", indicador de origen en la venta convertida.
- Dashboard: presupuestos activos, próximos a vencer (≤3 días), tasa de conversión.

### 2.2 Fuera de alcance

- Cambiar el modelo de estados de `Budget` (se mantienen los 4 actuales: `Open/Converted/Expired/Cancelled`, no se agregan `Draft/Sent/Accepted/Rejected`).
- Tocar el diseño del PDF o cambiar de librería (QuestPDF ya está y ya resuelve esto).
- Cambiar cómo funciona la numeración correlativa (ya funciona como se necesita).
- Envío automático por WhatsApp/email, formulario público de presupuesto, multi-usuario/roles, facturación fiscal — mismo fuera-de-alcance que el borrador original.

## 3. Modelo de datos — delta sobre lo existente

### 3.1 `Product` (agregar campo)

```
WholesalePrice: decimal?   // null = sin precio mayorista disponible para este producto
```

**Validación:** si `WholesalePrice` está definido, debe ser **estrictamente menor** que `Price` (sin excepciones en esta fase — si en el futuro la dueña pide una excepción puntual, se revisa esa validación entonces).

### 3.2 `PriceType` (enum nuevo, o reutilización de `ClientType`)

Mismos dos valores que `ClientType` (`Retail`/`Wholesale`). **Decisión de implementación:** reutilizar el enum `ClientType` ya existente para tipar el nuevo campo por línea (evita duplicar un enum idéntico), con un nombre de propiedad distinto (`PriceType`) para que quede claro que es una decisión por ítem, no el tipo de cliente del documento completo.

### 3.3 `BudgetItem` (agregar campo)

```
PriceType: ClientType = Retail   // default Retail si no se especifica
```

`UnitPrice` sigue siendo el snapshot — ahora tomado de `Product.Price` o `Product.WholesalePrice` según `PriceType` al momento de crear/editar el ítem.

### 3.4 `SaleItem` (agregar campo, igual que 3.3)

```
PriceType: ClientType = Retail
```

### 3.5 `Budget` y `Sale` (agregar campos, misma forma en ambas entidades)

```
DiscountType: enum { Percent, Fixed } = Percent   // nuevo
DiscountFixedAmount: decimal = 0                   // nuevo, usado solo si DiscountType = Fixed
```

- `DiscountPercent` (ya existe) se sigue usando cuando `DiscountType = Percent`, y ahora **admite valores negativos** para representar un recargo (ej. `-15` = recargo del 15%, `10` = descuento del 10%, manteniendo el signo tal como lo tipea la dueña).
- `DiscountFixedAmount` se usa solo cuando `DiscountType = Fixed`: monto absoluto, positivo = recargo, negativo = descuento.
- `DiscountAmount` (ya existe, computado) sigue siendo el resultado neto del ajuste, cualquiera sea el tipo — así el PDF y el resto del código que ya lo consume no cambian.
- **`TaxRatePercent`/`TaxAmount` (IVA) no cambian** — siguen aplicándose después del descuento, como ya está en `DocumentTotalsCalculator`.

### 3.6 `Budget` (agregar campos de trazabilidad)

```
ConvertedSaleId: int?
ConvertedAt: DateTime?
```

### 3.7 `Sale` (agregar campo de trazabilidad)

```
BudgetId: int?   // FK opcional al presupuesto de origen, si la venta nació de una conversión
```

## 4. Reglas de negocio

### 4.1 Cálculo de totales (extiende `DocumentTotalsCalculator.Compute`)

```
Si DiscountType == Percent:
    DiscountAmount = Round(Subtotal * DiscountPercent / 100, 2)
Si DiscountType == Fixed:
    DiscountAmount = DiscountFixedAmount

NetAmount = Subtotal - DiscountAmount        // si DiscountAmount es negativo (recargo), esto suma
TaxAmount = Round(NetAmount * TaxRatePercent / 100, 2)
Total = NetAmount + TaxAmount
```

Todo server-side, ignorando cualquier total que mande el cliente (mismo patrón anti-manipulación ya vigente).

### 4.2 Precio por línea

- Al crear/editar un `BudgetItem` o `SaleItem` con `PriceType = Wholesale`: el backend usa `Product.WholesalePrice` como `UnitPrice`. Si `Product.WholesalePrice` es `null` → **400 Bad Request**.
- Con `PriceType = Retail` (o no especificado): usa `Product.Price`, como ya funciona hoy.

### 4.3 Conversión Presupuesto → Venta (`POST /api/budgets/{id}/convert`)

Precondición: `Budget.Status == Open`. Si no, 400.

Pasos (transaccional):
1. Validar stock suficiente de **todos** los ítems (mismo `UPDATE ... WHERE Stock >= cantidad` atómico que ya usa `Sale`). Si falta stock de cualquier ítem → 400, **sin conversión parcial**.
2. Crear `Sale` nueva:
   - `ClientId`, `Customer`, `ClientType` ← copiados del `Budget`.
   - `SaleItem`s ← copiados 1:1 desde `BudgetItem`s (`ProductId`, `ProductName`, `Quantity`, `UnitPrice`, `PriceType`) — **no se recalculan precios**, se respeta lo presupuestado.
   - `DiscountType`, `DiscountPercent`, `DiscountFixedAmount`, `TaxRatePercent` ← copiados del `Budget`, de modo que `Sale.Total` coincida con `Budget.Total`.
   - `Status = Pending`, `PaymentMethod` ← lo elige la dueña en el momento de convertir (parámetro del request).
   - `BudgetId = Budget.Id`.
   - `Number` ← asignado por `DocumentNumberingService` (serie de `Sale`, como ya funciona).
3. Descontar stock (recién acá, nunca antes).
4. `Budget.Status = Converted`, `ConvertedSaleId = Sale.Id`, `ConvertedAt = now`.

### 4.4 Reconversión tras cancelar la venta generada

Si una `Sale` con `BudgetId` no nulo pasa a `Status = Cancelled` (vía `PATCH /api/sales/{id}/status`, flujo ya existente que repone stock):
- Buscar el `Budget` con `Id == Sale.BudgetId`.
- Si `Budget.Status == Converted`, volver a `Budget.Status = Open` (queda convertible de nuevo). `ConvertedSaleId`/`ConvertedAt` se limpian (`null`) para reflejar que ya no hay una venta vigente asociada — el vínculo histórico queda igual accesible desde `Sale.BudgetId` (que no se borra).
- Si el `Budget` ya había vencido (`Expired`) entre medio, **no** se reabre — se prioriza el vencimiento. **[Regla asumida por consistencia; confirmar si en la práctica esto genera fricción.]**

### 4.5 Auto-vencimiento perezoso

En `GetAll`/`GetById` de `BudgetsController`: si `Status == Open` y `ValidUntil < DateTime.UtcNow`, actualizar a `Expired` y persistir **antes** de devolver el resultado (ya sea en la query o en un paso posterior a cargar los candidatos).

### 4.6 Validación `WholesalePrice`

Al crear/editar un `Product`: si `WholesalePrice` no es `null`, debe ser `< Price`. Si no, 400.

## 5. API — endpoints nuevos y modificados

```
POST   /api/budgets/{id}/convert        NUEVO — body: { paymentMethod }. Ver §4.3.

POST/PUT /api/products                  body acepta wholesalePrice?: decimal
POST/PUT /api/budgets                   cada item acepta priceType?: "Retail"|"Wholesale" (default Retail)
POST/PUT /api/sales                     cada item acepta priceType?: "Retail"|"Wholesale" (default Retail)
POST/PUT /api/budgets                   body acepta discountType?, discountFixedAmount? (además de discountPercent existente)
POST/PUT /api/sales                     idem
```

Todos bajo `X-Admin-Key`, sin endpoints públicos nuevos.

## 6. Panel Admin — cambios de UI

- **`/admin/productos`**: campo `Precio mayorista` (opcional) en el formulario, con validación en vivo (`< Precio`).
- **`/admin/presupuestos/nuevo` y edición**: por cada línea de producto, toggle Retail/Wholesale — deshabilitado (con tooltip "sin precio mayorista") si el producto no tiene `WholesalePrice`. Campo de descuento pasa a tener selector de tipo (%/monto) y admite valores negativos con etiqueta clara ("recargo" si negativo... o si se prefiere UX: dos campos separados "Descuento" y "Recargo" que internamente mapean al mismo `DiscountPercent`/`DiscountFixedAmount` con signo — **a definir en implementación de UI, no cambia el contrato de datos**).
- **`/admin/presupuestos/{id}`**: botón **"Convertir en venta"**, visible solo si `Status == Open`; abre un modal para elegir `PaymentMethod` y confirma. Tras convertir, muestra link a la `Sale` generada.
- **`/admin/ventas`**: mismo toggle Retail/Wholesale por línea en el alta manual. En el detalle, si `Sale.BudgetId` no es nulo, mostrar "Generada desde Presupuesto N° X" con link.
- **Dashboard**: tarjeta con presupuestos activos (`Open`), próximos a vencer (`ValidUntil` ≤ 3 días desde hoy, `Status == Open`), y tasa de conversión (`Converted / (Converted + Cancelled + Expired)` del período).

## 7. No funcionales

- Todo el cálculo y las transiciones de estado son server-side, fuente de verdad en el backend .NET (mismo principio ya vigente en todo el proyecto).
- Sin endpoints públicos nuevos, sin cambios de infraestructura de despliegue, sin jobs en background (vencimiento sigue siendo perezoso, igual que ya funciona para el resto).

## 8. Supuestos cerrados en esta ronda (ya no están abiertos)

1. ~~¿Estados de Budget?~~ → se mantienen los 4 actuales.
2. ~~¿IVA vs ajuste general?~~ → el ajuste extiende el `Discount` existente; el IVA no se toca.
3. ~~¿Alcance del precio mayorista?~~ → Presupuestos y Ventas.
4. ~~¿Reglas de conversión?~~ → como en el spec original + reconversión si se cancela la venta resultante.
5. ~~¿Librería/diseño de PDF?~~ → ya resuelto, es QuestPDF con el diseño existente, sin cambios.

## 9. Supuestos abiertos (a validar durante o después de implementar, bajo impacto)

1. `WholesalePrice < Price` estricta sin excepciones — confirmar que esto no choca con algún caso real de la dueña.
2. Si un `Budget` se reabre a `Open` tras cancelar su venta (4.4) mientras ya venció (`Expired` sería el estado "correcto" en ese momento) — se prioriza el vencimiento y no se reabre. Validar con la dueña si esto genera fricción en la práctica.
3. Formato de número mostrado (`0001` plano vs. prefijo `P-0001`/`V-0001`) — se mantiene el formato plano actual, sin prefijo, salvo que se pida lo contrario.

## 10. Criterios de aceptación (Definition of Done)

- [ ] Un producto puede tener `WholesalePrice` opcional, validado `< Price` al guardar.
- [ ] Al cargar un ítem de Presupuesto o Venta, se puede elegir Retail/Wholesale por línea; si el producto no tiene `WholesalePrice`, la opción Wholesale es rechazada (400 backend, deshabilitada en UI).
- [ ] El descuento admite porcentaje o monto fijo, y valores negativos (recargo), sin afectar el cálculo de IVA que sigue aparte.
- [ ] `POST /api/budgets/{id}/convert` crea una `Sale` real: copia ítems y ajustes, descuenta stock atómicamente, rechaza completo (400) si falta stock de cualquier ítem, y solo funciona si el `Budget` está `Open`.
- [ ] Al cancelar una `Sale` generada por conversión, el `Budget` de origen vuelve a `Open` (salvo que ya haya vencido).
- [ ] Un presupuesto `Open` vencido pasa a `Expired` automáticamente al consultarlo/listarlo.
- [ ] El dashboard muestra presupuestos activos, próximos a vencer y tasa de conversión.
- [ ] Todos los endpoints nuevos/modificados respetan `X-Admin-Key`.
