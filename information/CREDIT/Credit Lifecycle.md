# Credit Lifecycle
Versión: 0.1

---

# Objetivo
Definir el ciclo de vida completo de un Commitment.
Todo compromiso financiero atraviesa una serie de estados hasta ser completamente cancelado.

---

# Ciclo de Vida
Nuevo Commitment
↓
Pending
↓
Partial
↓
Completed

---

# Estado: Pending
El compromiso fue creado.
Todavía no recibió ningún pago.

## Acciones permitidas
- Editar.
- Registrar pago.
- Cancelar.

---

# Estado: Partial
El compromiso recibió uno o más pagos.
Todavía existe saldo pendiente.

## Acciones permitidas
- Registrar pago.
- Editar (solo información descriptiva o que no altere los pagos ya realizados).
- Consultar historial.
- Cancelar: **No permitida** (requiere reversión mediante transacción en Tracker).


---

# Estado: Completed
El compromiso fue cancelado completamente.
No existe saldo pendiente.

## Acciones permitidas
- Consultar.
- Auditar.
No admite nuevos pagos.

---

# Transiciones
Pending
↓
Payment
↓
Partial
↓
Payment
↓
Completed

---

Pending
↓
Full Payment
↓
Completed

---

Pending
↓
Cancel
↓
Deleted

---

# Reglas

## Un Commitment nunca puede volver a Pending.
## Un Commitment Completed no puede recibir nuevos pagos.
## Un Commitment parcialmente pagado (Partial) no puede cancelarse ni eliminarse.
Debe ser completado mediante pagos o revertido mediante nuevos eventos financieros en el ledger del Tracker.
## Todo Payment reduce el capital comprometido de uno o más Installments.
## Ningún Payment puede superar el saldo pendiente del Commitment.
## El saldo pendiente nunca puede ser negativo.
## El estado del Commitment siempre es consecuencia de su saldo pendiente y del estado de sus Installments.
Nunca se modifica manualmente.

---

# Responsabilidad del Dominio
El CSP administra únicamente:
- Compromisos existentes (`Commitments`) y sus cuotas (`Installments`).
- Saldo pendiente por cuota y total.
- Historial de pagos imputados (`Payments`).
- Estado del compromiso.

Nunca administra:
- Patrimonio total neto.
- Inversiones o rentabilidad.
- Flujo de caja o cuentas bancarias reales.

Estas responsabilidades pertenecen al Financial Operating System y al Tracker.

