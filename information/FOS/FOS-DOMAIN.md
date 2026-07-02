# Modelo de Dominio (FOS)
> Versión: 1.0
> Estado: Borrador

---

# 1. Propósito
Este documento define el vocabulario oficial del Sistema Operativo Financiero (FOS).
Todos los documentos, reglas y componentes del sistema deberán utilizar estas definiciones de forma consistente.

---

# 2. Entidades
## Patrimonio
Conjunto de todos los activos financieros administrados por el sistema.
Representa el estado financiero completo del usuario.

---

## Activo
Recurso financiero que posee un valor económico.
Todo activo pertenece a una única capa.

---

## Capa
Nivel funcional dentro de la arquitectura patrimonial.
Cada capa tiene una única responsabilidad y un único objetivo.

---

## Asignación
Proceso mediante el cual un monto de dinero es distribuido entre una o más capas siguiendo las reglas del sistema.

---

## Movimiento
Transferencia de capital entre dos capas o entre una fuente externa y una capa.

---

## Evento
Situación que modifica el estado del patrimonio.
Ejemplos: ingreso de sueldo, freelance, aguinaldo, compra importante, venta de un activo.

---

## Estado
Fotografía completa del patrimonio en un momento determinado.
Es el punto de partida para toda decisión del sistema.

---

## Objetivo
Estado deseado que una capa o el patrimonio completo intenta alcanzar.
Los objetivos son definidos por parámetros, no por valores fijos.

---

## Regla
Condición determinística que transforma un estado en una acción.
Todas las decisiones del sistema son consecuencia de reglas.

---

## Parámetro
Valor configurable utilizado por las reglas.
Puede modificarse sin alterar la filosofía del sistema.

---

## Política Patrimonial
Conjunto de reglas permanentes que gobiernan el movimiento del capital dentro del sistema.
Representa la implementación práctica de los principios definidos en el FOS.

---

## Principio de Evolución del Modelo
El modelo puede almacenar información que el motor todavía no utiliza, siempre que dicha información pueda aportar valor en futuras versiones del sistema.

---

# 3. Relaciones
* El patrimonio está compuesto por activos.
* Todo activo pertenece a una capa.
* Las capas contienen activos.
* Los eventos modifican el estado.
* El estado activa reglas.
* Las reglas generan asignaciones.
* Las asignaciones producen movimientos.
* Los parámetros ajustan las reglas.
* La Política Patrimonial coordina el comportamiento completo del sistema.

---

# 4. Restricciones
* Un activo no puede pertenecer a más de una capa.
* Una capa solo puede cumplir una función.
* Una regla no puede contradecir los principios del FOS.
* Los parámetros pueden cambiar; las definiciones del dominio no.
