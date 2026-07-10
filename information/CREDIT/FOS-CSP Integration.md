# FOS-CSP Integration
Versión: 0.1

---

# Propósito
Este documento define cómo interactúan el **Financial Operating System (FOS)** y el **Credit System (CSP)**, estableciendo sus límites de responsabilidad y las fórmulas que unen sus datos bajo la orquestación del **Tracker**.

---

# Arquitectura de Integración

El sistema se divide en tres capas bien diferenciadas:

```
          [ Tracker ] (Ledger Único)
          /         \
         /           \
  [ FOS ]             [ CSP ]
(Activos/Net Worth)  (Obligaciones/Cuotas)
```

## 1. El Tracker como Orquestador
El **Tracker** es el punto de entrada y el dueño del ledger continuo de transacciones. 
- Toda acción económica que implique movimiento de caja real (efectivo, débito, transferencia bancaria, pago de tarjeta) pasa por el Tracker como una `Transaction`.
- El Tracker notifica al CSP cuando ocurre un evento de flujo de caja (`Cash Flow Event`) que afecta a un compromiso.
- El Tracker consolidará la información del FOS y del CSP para calcular el estado patrimonial disponible.

## 2. Límites de Responsabilidad (Bounties)
- **El FOS nunca calcula el Capital Comprometido (`Committed Capital`).** No sabe qué cuotas vencen en el futuro ni qué tarjetas se están utilizando.
- **El CSP nunca calcula el Patrimonio (`Net Worth` o `Net Balance`).** No sabe cuánto dinero hay en el banco ni qué inversiones posee el usuario.

---

# Fórmulas de Integración Patrimonial

La integración se realiza en un único punto consolidado por el Tracker a partir de los datos que proveen ambos dominios:

### 1. Capital Comprometido (Committed Capital)
Calculado por el CSP:
$$\text{Committed Capital}_{\text{mes}} = \sum \text{Amount de Installments activos con Due Date en ese mes}$$

### 2. Patrimonio Neto Consolidado (Net Worth)
Calculado por el FOS a partir del ledger:
$$\text{Net Worth} = \text{Activos Líquidos} = \text{Saldos en cuentas y efectivo}$$

### 3. Capital Disponible (Available Capital)
Calculado por el Tracker combinando los dos dominios:
$$\text{Available Capital} = \text{Net Worth} - \text{Committed Capital}$$

> [!IMPORTANT]
> El FOS utiliza únicamente el **Available Capital** para sus propuestas de asignación mensual. Todo dinero considerado *Committed Capital* queda excluido de nuevas decisiones financieras o inversiones de largo plazo.

---

# Flujo de Eventos de Integración

A continuación se muestra el ciclo de vida de una compra a crédito y su posterior pago:

```
[Compra Realizada] (Economic Event)
  │
  ▼
1. El usuario registra la compra en el Tracker.
2. El CSP crea el "Commitment" y genera sus "Installments" con sus respectivas "Due Dates".
3. El FOS permanece inalterado (el dinero líquido en banco no ha cambiado).
4. El Tracker recalcula el "Available Capital" (el capital disponible disminuye porque el capital comprometido aumentó).

... pasa el tiempo hasta el vencimiento ...

[Pago del Resumen] (Cash Flow Event)
  │
  ▼
1. El usuario realiza el pago y el Tracker registra la "Transaction" en el ledger.
2. El FOS procesa la transacción y actualiza los saldos (el Net Worth disminuye por la salida del dinero).
3. El Tracker notifica al CSP del pago.
4. El CSP registra el "Payment", cancela los "Installments" correspondientes y actualiza el estado del "Commitment".
5. El Tracker recalcula: el "Committed Capital" disminuye en la misma proporción que el "Net Worth", manteniendo el "Available Capital" balanceado.
```
