# Credit Domain Model
Versión: 0.1

---

# Entidades
## Commitment
Representa un compromiso financiero adquirido por el usuario.
Ejemplos:
- Compra con tarjeta de crédito
- Compra en cuotas
- Reserva futura
- Pago diferido
- Préstamo pendiente

Un Commitment existe independientemente del movimiento bancario.

---

## Installment (Cuota)
Representa una unidad de pago temporal individual perteneciente a un Commitment.
Posee las siguientes propiedades:
- **Amount**: El monto de la cuota.
- **Due Date**: Fecha de vencimiento de la cuota (mes/año en que debe ser pagada).
- **Status**: Estado de la cuota (Pending, Completed).

---

## Payment
Representa un pago realizado para reducir uno o más Commitments.
Un Payment produce un movimiento real de dinero en el ledger del Tracker.

---

## Payment Method (Value Object)
Representa el medio utilizado para originar un compromiso o realizar un pago.
No posee identidad propia ni ciclo de vida.
Ejemplos:
- Débito
- Crédito
- Transferencia
- Efectivo

Modifica el flujo temporal del dinero, no el significado económico del gasto.


---

# Estados
## Pending
El compromiso existe y todavía no fue cancelado.

---

## Partial
El compromiso fue pagado parcialmente.

---

## Completed
El compromiso fue cancelado completamente.

---

# Relaciones
Commitment (posee un Payment Method)
↓
contiene
↓
Installments (Cuotas)
↓
son canceladas mediante
↓
Payments

---

# Conceptos
## Economic Event
Momento en que ocurre la decisión financiera.
Ejemplo: Comprar una notebook.

---

## Cash Flow Event
Momento en que el dinero entra o sale realmente de una cuenta.
Ejemplo: Pago del resumen de tarjeta.

---

## Available Capital
Capital realmente disponible para nuevas decisiones financieras.
No incluye dinero comprometido.

---

## Committed Capital
Capital reservado para cumplir compromisos existentes.
Forma parte del patrimonio, pero deja de estar disponible para nuevas asignaciones.

---

## Financial Snapshot
Fotografía completa del estado financiero del usuario en un momento determinado.
Incluye:
- Patrimonio
- Capital disponible
- Capital comprometido
- Compromisos pendientes

---

# Responsabilidades
## Tracker (Orquestador Principal)
- Administrar el ledger único de transacciones (`transactions`).
- Recibir los pagos registrados por el usuario.
- Notificar al CSP sobre nuevos pagos realizados para que este concilie compromisos.
- Presentar el `Financial Snapshot` consolidado al usuario.

---

## CSP
- Administrar compromisos (`Commitments`) e intereses/cuotas (`Installments`).
- Administrar la conciliación interna de pagos contra cuotas.
- Calcular el capital comprometido (`Committed Capital`) por período/fecha de vencimiento (`Due Date`).
- Informar la deuda pendiente.

Nunca administra inversiones ni saldos bancarios reales.

---

## FOS
- Administrar el patrimonio neto total e inversiones.
- Administrar capas patrimoniales de activos líquidos reales.
- Distribuir el capital disponible (`Available Capital`) para realizar nuevas asignaciones patrimoniales.

Nunca administra compromisos individuales ni deudas futuras detalladas.

---

# Integración
El CSP calcula e informa al Tracker el `Committed Capital` según los vencimientos.
El Tracker resta este capital del saldo patrimonial del FOS para calcular el `Available Capital` que se presenta al usuario.

