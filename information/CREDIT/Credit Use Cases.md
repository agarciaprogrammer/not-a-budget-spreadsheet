# Credit Use Cases
Versión: 0.1

---

# Objetivo
Definir las operaciones que el usuario puede realizar sobre compromisos financieros.
Estos casos de uso describen únicamente el comportamiento esperado del dominio, independientemente de la interfaz o implementación.

---

# CSP-001 — Registrar un nuevo compromiso
## Descripción
El usuario registra un compromiso financiero.
El sistema crea un nuevo Commitment con estado Pending.

## Ejemplos
- Compra con tarjeta.
- Compra en una cuota.
- Reserva con pago diferido.

---

# CSP-002 — Registrar un compromiso con pagos múltiples
## Descripción
El usuario registra un compromiso compuesto por múltiples pagos futuros.
El sistema crea un único Commitment compuesto por varios Installments (cuotas), cada uno con su correspondiente monto (`Amount`), fecha de vencimiento (`Due Date`) y estado inicial `Pending`.

## Ejemplos
- Compra en 3 cuotas.
- Compra en 6 cuotas.
- Compra en 12 cuotas.

---

# CSP-003 — Registrar un pago
## Descripción
El Tracker detecta en el ledger de transacciones un pago realizado por el usuario.
El Tracker le informa al CSP sobre este pago.
El CSP registra el `Payment` correspondiente, lo imputa al `Installment` más antiguo o específico, y actualiza el estado de las cuotas y del `Commitment` afectado a `Completed` si su saldo pendiente llega a cero.

---

# CSP-004 — Registrar un pago parcial
## Descripción
El Tracker detecta e informa un pago menor al saldo pendiente del período/cuota.
El CSP registra el `Payment`, reduce el capital comprometido de ese `Installment`, y cambia el estado del `Commitment` a `Partial` si ya se realizaron pagos parciales pero aún resta saldo.

---

# CSP-005 — Completar un compromiso
## Descripción
El CSP detecta que la suma de todos sus `Installments` pendientes es igual a cero.
El `Commitment` cambia automáticamente al estado `Completed`.

---

# CSP-006 — Consultar compromisos pendientes
## Descripción
El usuario consulta todos los compromisos que todavía afectan su patrimonio.
El sistema muestra únicamente `Commitment` en estado `Pending` o `Partial`, detallando el calendario de cuotas (`Installments`) pendientes por fecha de vencimiento (`Due Date`).

---

# CSP-007 — Consultar historial
## Descripción
El usuario consulta compromisos finalizados.
El sistema muestra todos los `Commitment` en estado `Completed`.

---

# CSP-008 — Editar un compromiso
## Descripción
El usuario modifica información de un compromiso existente (por ejemplo, cambia la cantidad de cuotas o el monto total).
El CSP recalcula automáticamente los `Installments` asociados, su fecha de vencimiento y su saldo pendiente.

---

# CSP-009 — Cancelar un compromiso
## Descripción
El usuario elimina un compromiso creado por error (solo si cumple la regla de negocio de no poseer pagos realizados).
El sistema revierte todos los cálculos asociados.

---

# CSP-010 — Informar capital comprometido
## Descripción
El CSP calcula el capital que permanece comprometido agrupado por mes/año según la fecha de vencimiento (`Due Date`) de los `Installments` pendientes.
Este valor será provisto al Tracker para calcular el Capital Disponible en el FOS.

