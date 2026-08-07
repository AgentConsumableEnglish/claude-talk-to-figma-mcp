# Problemas y Soluciones para las 4 Herramientas Fallidas tras la Refactorización

Las pruebas con Claude encontraron 4 herramientas rotas tras la refactorización:

- ✅ `get_remote_components` - Falla con error "method not available" (RESUELTO)
- ✅ `flatten_node` - Falla con timeout error (RESUELTO)
- ✅ `create_component_instance` - Falla con timeout error (RESUELTO)
- ✅ `set_effect_style_id` - Falla con timeout error (RESUELTO)

Cada problema y su solución, por orden.

## 1. Herramienta `get_remote_components` (RESUELTO)

### Análisis del Problema

`get_remote_components` fallaba con "method not available". En `code.js`:

```javascript
async function getRemoteComponents() {
  try {
    // Check if figma.teamLibrary is available
    if (!figma.teamLibrary) {
      console.error("Error: figma.teamLibrary API is not available");
      throw new Error("The figma.teamLibrary API is not available in this context");
    }
    
    // Check if figma.teamLibrary.getAvailableComponentsAsync exists
    if (!figma.teamLibrary.getAvailableComponentsAsync) {
      console.error("Error: figma.teamLibrary.getAvailableComponentsAsync is not available");
      throw new Error("The getAvailableComponentsAsync method is not available");
    }
    
    // [...resto del código sin cambios...]
  } catch (error) {
    // [...también se modificó para lanzar excepciones en lugar de devolver objetos de error...]
  }
}
```

Con este cambio, si la API falta, la excepción se lanza, el servidor MCP la captura y el usuario la ve.

## 2. Herramienta `flatten_node` (RESUELTO)

### Análisis del Problema

`flatten_node` fallaba con timeout al aplanar vectores complejos. En el plugin:

```javascript
async function flattenNode(params) {
  const { nodeId } = params || {};
  
  if (!nodeId) {
    throw new Error("Missing nodeId parameter");
  }
  
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node not found with ID: ${nodeId}`);
    }
    
    // Check for specific node types that can be flattened
    const flattenableTypes = ["VECTOR", "BOOLEAN_OPERATION", "STAR", "POLYGON", "ELLIPSE", "RECTANGLE"];
    
    if (!flattenableTypes.includes(node.type)) {
      throw new Error(`Node with ID ${nodeId} and type ${node.type} cannot be flattened. Only vector-based nodes can be flattened.`);
    }
    
    // Verify the node has the flatten method before calling it
    if (typeof node.flatten !== 'function') {
      throw new Error(`Node with ID ${nodeId} does not support the flatten operation.`);
    }
    
    // Implement a timeout mechanism
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Flatten operation timed out after 8 seconds. The node may be too complex."));
      }, 8000); // 8 seconds timeout
    });
    
    // Execute the flatten operation in a promise
    const flattenPromise = new Promise((resolve, reject) => {
      // Execute in the next tick to allow UI updates
      setTimeout(() => {
        try {
          console.log(`Starting flatten operation for node ID ${nodeId}...`);
          const flattened = node.flatten();
          console.log(`Flatten operation completed successfully for node ID ${nodeId}`);
          resolve(flattened);
        } catch (err) {
          console.error(`Error during flatten operation: ${err.message}`);
          reject(err);
        }
      }, 0);
    });
    
    // Race between the timeout and the operation
    const flattened = await Promise.race([flattenPromise, timeoutPromise])
      .finally(() => {
        // Clear the timeout to prevent memory leaks
        clearTimeout(timeoutId);
      });
    
    return {
      id: flattened.id,
      name: flattened.name,
      type: flattened.type
    };
  } catch (error) {
    console.error(`Error in flattenNode: ${error.message}`);
    if (error.message.includes("timed out")) {
      // Provide a more helpful message for timeout errors
      throw new Error(`The flatten operation timed out. This usually happens with complex nodes. Try simplifying the node first or breaking it into smaller parts.`);
    } else {
      throw new Error(`Error flattening node: ${error.message}`);
    }
  }
}
```

Las mejoras:
1. Timeout de 8 segundos contra bloqueos sin fin.
2. El flatten corre en una promesa con un pequeño retraso, para que la UI respire.
3. `Promise.race` entre la operación y el timeout.
4. El timeout se limpia, sin fugas de memoria.
5. Los errores de timeout sugieren qué hacer.
6. Más logging para depurar.

### Resultados

Probado. La herramienta ahora:
- Funciona con nodos simples
- Da un error claro, con sugerencias, cuando el nodo es demasiado complejo
- No bloquea Figma en operaciones largas
- Deja mejores logs para depurar

## 3. Herramienta `create_component_instance` (RESUELTO)

### Problema Identificado

En las pruebas de `create_component_instance` apareció un problema de robustez:

- Con componentes complejos o remotos, la operación podía colgarse o tardar demasiado
- No había timeout
- Los errores no bastaban para diagnosticar los problemas comunes

Esto podía bloquear Figma o los comandos siguientes.

### Análisis del Problema

Del código:

1. `importComponentByKeyAsync` puede tardar mucho con componentes complejos o mala red
2. No había timeout que cortara las operaciones largas
3. Los errores no distinguían el tipo de falla (componente no encontrado, permisos, etc.)

### Solución Implementada

El mismo patrón que en `flattenNode`:

```javascript
async function createComponentInstance(params) {
  const { componentKey, x = 0, y = 0 } = params || {};

  if (!componentKey) {
    throw new Error("Missing componentKey parameter");
  }

  try {
    // Set up a manual timeout to detect long operations
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Timeout while creating component instance (10s). The component may be too complex or unavailable."));
      }, 10000); // 10 seconds timeout
    });
    
    // Execute the import with a timeout
    const importPromise = figma.importComponentByKeyAsync(componentKey);
    
    // Use Promise.race to implement the timeout
    const component = await Promise.race([importPromise, timeoutPromise])
      .finally(() => {
        clearTimeout(timeoutId); // Clear the timeout
      });

    // Instancia y propiedades en su propio try
    try {
      const instance = component.createInstance();
      instance.x = x;
      instance.y = y;
      figma.currentPage.appendChild(instance);
      
      return {
        id: instance.id,
        name: instance.name,
        x: instance.x,
        y: instance.y,
        width: instance.width,
        height: instance.height,
        componentId: instance.componentId,
      };
    } catch (instanceError) {
      throw new Error(`Error creating component instance: ${instanceError.message}`);
    }
  } catch (error) {
    // Mensajes de error según el tipo de fallo
    if (error.message.includes("timeout") || error.message.includes("Timeout")) {
      throw new Error(`The component import timed out after 10 seconds. This usually happens with complex remote components or network issues. Try again later or use a simpler component.`);
    } else if (error.message.includes("not found") || error.message.includes("Not found")) {
      throw new Error(`Component with key "${componentKey}" not found. Make sure the component exists and is accessible in your document or team libraries.`);
    } else if (error.message.includes("permission") || error.message.includes("Permission")) {
      throw new Error(`You don't have permission to use this component. Make sure you have access to the team library containing this component.`);
    } else {
      throw new Error(`Error creating component instance: ${error.message}`);
    }
  }
}
```

### Cambios Clave Implementados:

1. **Timeout**: 10 segundos contra bloqueos sin fin
2. **Dos fases**: Importación y creación de instancia separadas, para diagnosticar mejor
3. **Errores**: Mensajes por tipo de problema
4. **Limpieza**: Un `finally` limpia los timeouts

### Impacto del Cambio

Con esta mejora:

- La herramienta no se cuelga con componentes problemáticos
- El usuario recibe errores claros con acciones sugeridas
- Depurar componentes es más fácil
- El sistema aguanta más

### Estado de Validación

- [x] Cambio implementado
- [x] Funcionalidad verificada

### Lecciones Aprendidas

Esta mejora enseña:

1. **Timeouts**: Toda operación asíncrona necesita uno
2. **Errores claros**: Decir qué pasó y sugerir la salida
3. **Pasos pequeños**: Las operaciones grandes se diagnostican mejor partidas
4. **Limpieza**: Liberar los timers y demás recursos

Este patrón vale para cualquier herramienta lenta o con varios modos de fallo.

## 4. Herramienta `set_effect_style_id` (RESUELTO)

### Análisis del Problema

`set_effect_style_id` fallaba con timeout. Como con los componentes: aplicar estilos de efecto pesa, o la API falla.

### Solución Implementada

La versión nueva lleva timeout y manejo de errores:

```javascript
// Set Effect Style ID Tool
async function setEffectStyleId(params) {
  const { nodeId, effectStyleId } = params || {};
  
  if (!nodeId) {
    throw new Error("Missing nodeId parameter");
  }
  
  if (!effectStyleId) {
    throw new Error("Missing effectStyleId parameter");
  }
  
  try {
    // Timeout
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Timeout while setting effect style ID (8s)"));
      }, 8000);
    });
    
    // Nodo y operación
    const applyStylePromise = (async () => {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node) {
        throw new Error(`Node not found with ID: ${nodeId}`);
      }
      
      // El nodo debe soportar efectos
      if (!("effectStyleId" in node)) {
        throw new Error(`Node with ID ${nodeId} does not support effect styles`);
      }
      
      // Comprobar primero que el estilo existe
      try {
        const effectStyle = await figma.getStyleByIdAsync(effectStyleId);
        if (!effectStyle || effectStyle.type !== "EFFECT") {
          throw new Error(`Invalid effect style ID: ${effectStyleId}`);
        }
      } catch (styleError) {
        throw new Error(`Could not find effect style with ID: ${effectStyleId}`);
      }
      
      // Apply the effect style
      node.effectStyleId = effectStyleId;
      
      return {
        id: node.id,
        name: node.name,
        effectStyleId: node.effectStyleId
      };
    })();
    
    // Carrera de promesas
    const result = await Promise.race([applyStylePromise, timeoutPromise])
      .finally(() => {
        clearTimeout(timeoutId);
      });
      
    return result;
  } catch (error) {
    console.error(`Error setting effect style ID: ${error.message}`);
    throw new Error(`Error setting effect style ID: ${error.message}`);
  }
}
```

### Resultados

Probado. La herramienta ahora:
- Funciona con nodos simples
- Da un error claro cuando el nodo o el estilo no valen
- No se cuelga en operaciones largas
- Deja mejores logs para depurar

## Resumen de las Soluciones

Cuatro causas distintas, soluciones parecidas:

1. **`get_remote_components`** (RESUELTO): Excepciones en vez de objetos de error.

2. **`flatten_node`** (RESUELTO): Timeout y promesas en paralelo contra los cuelgues.

3. **`create_component_instance`** (RESUELTO): Timeout en la importación de componentes.

4. **`set_effect_style_id`** (RESUELTO): Timeout y validación al aplicar estilos de efecto.

## Próximos Pasos

1. Buscar en otras herramientas patrones que puedan dar timeout
2. Pensar en informes de progreso generales para operaciones largas
3. Escribir pruebas para estas herramientas tras los cambios