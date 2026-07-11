# Dashboard UX

Versión: 0.1

---

# Objetivo

El Home debe responder las preguntas más importantes del usuario en menos de 20 segundos.

No busca mostrar toda la información del sistema.

Busca mostrar únicamente aquello que requiere atención o facilita una acción inmediata.

---

# Flujo principal

El usuario abre la aplicación.

↓

Comprende rápidamente su situación financiera.

↓

Si existe alguna alerta, la identifica inmediatamente.

↓

Realiza una o más acciones rápidas.

↓

Cierra la aplicación.

---

# Orden de importancia

## 1. Estado actual

El usuario debe responder inmediatamente:

- ¿Cuánto patrimonio tengo?
- ¿Cuánto capital puedo gastar?
- ¿Estoy bien este mes?

---

## 2. Alertas

Solo aparecen si requieren atención.

Ejemplos:

- Tarjeta próxima a vencer.
- Límite mensual cercano.
- Cuotas pendientes.
- Compromisos vencidos.

Si no existen alertas, el sistema debe comunicar tranquilidad.

Ejemplo:

"Everything looks healthy."

---

## 3. Acciones rápidas

Las operaciones frecuentes siempre deben estar visibles.

- Add Transaction
- Register Commitment
- Register Income
- Transfer

Nunca deben requerir navegar por la aplicación.

---

## 4. Actividad reciente

El usuario puede revisar rápidamente lo último que ocurrió.

No busca analizar.

Solo recordar.

---

## 5. Insights

Los gráficos son secundarios.

Nunca deben desplazar información operativa.

---

# Filosofía de navegación

Toda la información detallada debe abrirse mediante un modal.

El Home nunca debe crecer verticalmente únicamente para mostrar más información.

---

# Filosofía de información

Mostrar primero respuestas.

Mostrar después números.

Mostrar por último gráficos.

---

# Filosofía visual

El usuario nunca debe sentirse abrumado.

Los espacios vacíos son parte del diseño.

Cada sección debe tener una única responsabilidad.

---

# Filosofía temporal

Todo el Home representa un único período.

Al cambiar de mes, absolutamente toda la información cambia.

No existen componentes que mezclen información de distintos períodos.

---

# Filosofía de interacción

El usuario nunca debería preguntarse:

"¿Dónde estaba esa función?"

Las acciones frecuentes deben ser evidentes.

Las acciones poco frecuentes pueden estar ocultas dentro de modales o menús secundarios.

---

# Regla de oro

Si un componente requiere explicación, probablemente no pertenezca al Home.