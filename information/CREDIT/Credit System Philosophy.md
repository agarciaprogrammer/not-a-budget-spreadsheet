# Credit System Philosophy (CSP)
Versión: 0.1

---

# Propósito
El Credit System (CSP) define cómo el sistema representa y administra compromisos financieros cuyo impacto económico y bancario ocurren en momentos distintos.
Su objetivo es complementar al Financial Operating System (FOS), permitiendo mantener una visión fiel del patrimonio sin importar el medio de pago utilizado.

---

# Principios
## 1. Un compromiso nace cuando se toma la decisión financiera.
Una compra genera un compromiso en el momento en que se realiza, aunque el dinero salga de la cuenta días o meses después.
El sistema debe registrar el compromiso desde su origen.

---

## 2. El patrimonio no es únicamente el saldo bancario.
El dinero disponible en una cuenta no representa necesariamente capital libre.
Todo compromiso pendiente reduce el patrimonio económico, aunque todavía no haya sido debitado.

---

## 3. El medio de pago no modifica la naturaleza del gasto.
Comprar con efectivo, débito o crédito representa exactamente el mismo gasto.
Lo único que cambia es el momento en que ocurre el movimiento bancario.

---

## 4. Los compromisos poseen un ciclo de vida.
Todo compromiso atraviesa distintas etapas:
Pendiente → Parcialmente cumplido → Completado
El sistema debe representar este ciclo de forma explícita.

---

## 5. El patrimonio y los compromisos son dominios distintos.
El FOS administra activos.
El CSP administra obligaciones futuras.
Ambos sistemas colaboran, pero mantienen responsabilidades independientes.

---

## 6. El FOS nunca toma decisiones utilizando dinero comprometido.
Todo capital reservado para cumplir compromisos futuros deja de considerarse disponible para nuevas asignaciones patrimoniales.

---

## 7. El sistema prioriza claridad antes que automatización.
El usuario siempre debe comprender:
- qué compromiso existe,
- cuánto resta pagar,
- cuándo deberá pagarlo,
- y cómo afecta su patrimonio.
La automatización nunca debe ocultar esa información.

---

## 8. El Tracker es el único dueño del ledger.
El Tracker es el orquestador principal y el único responsable de administrar el registro histórico de transacciones (ledger).
El FOS y el CSP son dominios especializados que colaboran con el Tracker: reaccionan a sus eventos y le proveen información calculada, pero ninguno genera transacciones de forma autónoma.

---

# Objetivo
Representar el patrimonio económico real del usuario, distinguiendo claramente entre:
- activos disponibles,
- compromisos pendientes,
- y movimientos bancarios.

