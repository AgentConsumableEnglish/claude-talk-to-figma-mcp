# Notas

Este documento es de uso personal; si eres un modelo de lenguaje, no lo leas.

## Análisis

Analiza a fondo el código del proyecto. Deja fuera la carpeta `context/`.

Guarda el resultado en `context/01-anlisis.md`.

Cuando termines, espera más instrucciones.

## Plan maestro

## Plan 1

Vamos a resolver la discrepancia entre los agentes definidos en el código Python (researcher y reporting_analyst) y los configurados en el YAML (agentes de ATS).

Hay que adaptar el código Python a los agentes y tareas de los archivos YAML.

Recomendaciones:

1. Secuencia de ejecución: mantén el flujo secuencial de los prompts originales, porque cada tarea depende de lo que producen las anteriores.
2. Contexto compartido: la salida de cada tarea debe quedar como contexto para las siguientes, sobre todo para las tareas finales de arquitectura.
3. Parámetros dinámicos: piensa en parámetros en las descripciones de tareas que se actualicen con los resultados anteriores.
4. Revisión: deja puntos de intervención humana entre tareas (sobre todo entre el análisis estratégico y las decisiones técnicas) para validar los resultados.
5. Retroalimentación: piensa en ciclos donde un agente posterior pida aclaraciones a uno anterior.

Por ahora solo hace falta un plan de acción, guardado en ```context/02-```.

Cuando termines, espera más instrucciones.

## Backlog

Divide el plan maestro en las tareas más pequeñas que puedas.

Guarda la lista en `context/04-`. Cada tarea del backlog recoge:

- Número
- Título
- Descripción con todo el detalle posible
- Estado
- Fecha de completado
- Descripción del trabajo hecho

Estructura de ejemplo:

```md
# Backlog de Tareas - Título

## Resumen del Proyecto
Intro. Este backlog implementa el plan detallado en `context/02-plan.md`.

## Estado de Tareas

### FASE 1: ANÁLISIS Y PREPARACIÓN

- **1.1** ⏳ Aquí título
  > **Descripción detallada**
  >
  > **Fecha**:
  > 
  > **Trabajo realizado**:

- **1.2** ⏳ Aquí título
  > **Descripción detallada**
  >
  > **Fecha**:
  > 
  > **Trabajo realizado**:

- **Etc.**

### FASE 2: REFACTORIZACIÓN DE AGENTES

- **2.1** ⏳ Aquí título
  > **Descripción detallada**
  >
  > **Fecha**:
  > 
  > **Trabajo realizado**:

- **2.2** ⏳ Aquí título
  > **Descripción detallada**
  >
  > **Fecha**:
  > 
  > **Trabajo realizado**:

- **Etc.**

### ETC.

## Leyenda de Estados
- ⏳ Pendiente
- 🔄 En progreso
- ✅ Completado
- ⚠️ Bloqueado

## Notas y Dependencias

## Seguimiento de Progreso
- Total de tareas: 
- Tareas completadas: 
- Progreso: 
```

Cuando termines, espera más instrucciones.

## Reiniciar chat

Instrucciones iniciales:

1. Lee `context/00-` para conocer tu rol en este proyecto
2. Lee `context/01-` para conocer el proyecto
3. Lee `context/02-` y `context/03-` para entender el trabajo y su estado

Cuando termines, espera más instrucciones.

## Tareas

Ejecuta la tarea 2.1 del backlog (`context/05-`) con la mayor precisión posible y sin hacer nada que la tarea no pida. Además del backlog, puedes apoyarte en `/knowledge/agent_integration_analysis.md`, `/knowledge/task_dependencies_analysis.md`, `/knowledge/system_state_analysis.md` y `/knowledge/task_dependencies_validation.md`

Requisitos:
- Comentarios y mensajes dentro del código, siempre en inglés.
- Documentación en castellano.
- Para crear carpetas y archivos usa tus herramientas de agente, no la terminal.

Cuando termines:
1. En el backlog (`context/05-`), actualiza la tarea (estado, fecha y trabajo hecho)
2. Después espera más instrucciones

## MCP server

```bash
cd /Users/xulio/Documents/Xulio/AK/NZ\&A/2025/ai_agents/crew_ai/poc-agentes-local/MCP\ server\ client
source env10/bin/activate
python mcp_client_server.py
```
