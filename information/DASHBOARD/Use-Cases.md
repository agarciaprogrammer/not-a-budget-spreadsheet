# Dashboard Use Cases

Versión: 0.1

---

# DB-001 Abrir Dashboard

## Objetivo

Comprender el estado financiero actual.

---

Secuencia

1. El usuario abre la aplicación.
2. El sistema muestra el Dashboard.
3. El usuario visualiza el Snapshot.
4. El flujo finaliza.

---

# DB-002 Registrar una Transacción

## Objetivo

Registrar rápidamente un movimiento financiero.

---

Secuencia

1. El usuario presiona "Add Transaction".
2. Completa el formulario.
3. Guarda.
4. El Dashboard actualiza los datos.

---

# DB-003 Registrar un Compromiso

## Objetivo

Registrar una compra realizada con tarjeta.

---

Secuencia

1. El usuario presiona "Register Commitment".
2. Completa el formulario.
3. Guarda.
4. El CSP genera el Commitment.
5. El Dashboard actualiza la información.

---

# DB-004 Consultar Actividad

## Objetivo

Revisar operaciones recientes.

---

Secuencia

1. El usuario navega la sección Activity.
2. Puede cambiar entre:
   - Transactions
   - Commitments
   - Installments
3. El flujo finaliza.

---

# DB-005 Consultar Información Detallada

## Objetivo

Profundizar una métrica.

---

Secuencia

1. El usuario selecciona una tarjeta.
2. El sistema abre un modal.
3. Se muestra información ampliada.
4. El usuario cierra el modal.

---

# DB-006 Revisar Alertas

## Objetivo

Detectar tareas pendientes.

---

Ejemplos

- Cuotas próximas.
- Vencimiento de tarjeta.
- Límite mensual.
- Compromisos pendientes.

---

# DB-007 Ejecutar una Acción Rápida

## Objetivo

Realizar una operación sin abandonar el Dashboard.

---

Ejemplos

- Registrar ingreso.
- Registrar gasto.
- Registrar compromiso.
- Transferencia.

---

# DB-008 Acceder al Financial Operating System

## Objetivo

Ejecutar la asignación patrimonial mensual.

---

Secuencia

1. El usuario selecciona "Financial Operating System".
2. El sistema navega al módulo FOS.
3. El Dashboard conserva su estado.

---

# Fuera del alcance

El Dashboard no:

- ejecuta reglas del FOS.
- calcula estrategias.
- decide asignaciones.
- modifica políticas del sistema.