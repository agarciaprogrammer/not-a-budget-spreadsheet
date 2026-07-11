# Dashboard Domain Model

Versión: 0.1

---

# Dashboard

Centro de operaciones del sistema.

Integra información proveniente del Tracker, CSP y FOS.

No posee reglas de negocio propias.

---

# Snapshot

Resumen inmediato del estado financiero.

Ejemplos:

- Net Worth
- Available Capital
- Committed Capital
- Monthly Spending

---

# Activity

Registro de la actividad reciente.

Puede mostrar:

- Transactions
- Commitments
- Installments
- Transfers

---

# Quick Action

Operación frecuente que debe poder ejecutarse inmediatamente.

Ejemplos:

- Add Transaction
- Register Commitment
- Register Income
- Transfer

---

# Insight

Información analítica.

No modifica el dominio.

Ejemplos:

- Category Distribution
- Spending Trend
- Weekly Spending
- Monthly Limit

---

# Alert

Información que requiere atención.

Ejemplos:

- Card Due Date
- Monthly Limit reached
- Pending Installments

---

# Modal

Vista secundaria utilizada para profundizar información.

No reemplaza una página.

Debe poder cerrarse sin perder contexto.

---

# Widget

Componente visual reutilizable.

Todo widget responde exactamente una pregunta del usuario.

---

# Operational Context4

Estado actual del usuario.

Describe:4

- qué tiene
- qué debe
- qué ocurrió
- qué puede hacer

Nunca describe el futuro.

El futuro pertenece al FOS.