# Backlog de Soluciones para las Herramientas Fallidas

Soluciones hechas y pendientes para las herramientas que fallaban tras la refactorización.

## 1. Herramienta `get_remote_components` - RESUELTO ✅

**Fecha de solución**: 4 de mayo de 2025

**Problema detectado**: 
Fallaba con "method not available" cuando faltaba la API `figma.teamLibrary` o el método `getAvailableComponentsAsync`. No se trataba como un error normal, y el servidor MCP no podía procesar la respuesta.

**Causa raíz**:
El original devolvía un objeto con flags de error en vez de lanzar excepciones:

```javascript
if (!figma.teamLibrary) {
  console.error("Error: figma.teamLibrary API is not available");
  return {
    error: true,
    message: "The figma.teamLibrary API is not available in this context",
    apiAvailable: false
  };
}
```

El servidor MCP maneja excepciones, no objetos de error a medida. El usuario no veía el error.

**Solución implementada**:
Ahora se lanzan excepciones en vez de devolver objetos de error:

```javascript
if (!figma.teamLibrary) {
  console.error("Error: figma.teamLibrary API is not available");
  throw new Error("The figma.teamLibrary API is not available in this context");
}
```

También se añadió un timeout para que la operación no se cuelgue:

```javascript
// Set up a manual timeout to detect deadlocks
let timeoutId;
const timeoutPromise = new Promise((_, reject) => {
  timeoutId = setTimeout(() => {
    reject(new Error("Internal timeout while retrieving remote components (15s)"));
  }, 15000); // 15 seconds internal timeout
});

// Execute the request with a manual timeout
const fetchPromise = figma.teamLibrary.getAvailableComponentsAsync();

// Use Promise.race to implement the timeout
const teamComponents = await Promise.race([fetchPromise, timeoutPromise])
  .finally(() => {
    clearTimeout(timeoutId); // Clear the timeout
  });
```

**Beneficios de la solución**:
1. **Errores coherentes**: El servidor MCP captura y muestra los errores.
2. **Sin cuelgues**: El timeout corta la llamada a la API.
3. **Usuario**: Mensajes de error más claros.
4. **Robustez**: Maneja mejor los distintos errores.

**Lecciones aprendidas**:
1. Con frameworks que esperan excepciones, señala los errores con excepciones, no con objetos a medida.
2. Toda llamada a una API externa lleva timeout.
3. Los errores claros aceleran la depuración.

## 2. Herramienta `flatten_node` - RESUELTO ✅

**Fecha de solución**: 4 de mayo de 2025

**Problema detectado**:
`flatten_node` fallaba con timeout al aplanar vectores complejos. Podía colgarse sin avisar al usuario.

**Causa raíz**:
`flatten()` puede pesar mucho con vectores complejos (booleanas complicadas, vectores con muchos puntos). El original no tenía timeout ni trato para operaciones largas:

```javascript
// El original, problemático
const flattened = node.flatten();
```

Con esto:
1. Figma parecía congelado
2. La operación no acababa dentro del timeout del servidor MCP
3. El usuario no sabía nada del progreso ni de los problemas

**Solución implementada**:
Timeout y promesas en paralelo, con mejor aviso al usuario:

```javascript
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
```

Y errores más útiles:

```javascript
catch (error) {
  console.error(`Error in flattenNode: ${error.message}`);
  if (error.message.includes("timed out")) {
    // Provide a more helpful message for timeout errors
    throw new Error(`The flatten operation timed out. This usually happens with complex nodes. Try simplifying the node first or breaking it into smaller parts.`);
  } else {
    throw new Error(`Error flattening node: ${error.message}`);
  }
}
```

**Beneficios de la solución**:
1. **Sin cuelgues**: Límite de 8 segundos
2. **Usuario**: Errores con sugerencias en los timeouts
3. **UI viva**: La ejecución diferida deja respirar a Figma
4. **Sin fugas**: Los recursos se limpian al acabar
5. **Depuración**: Más logs

**Lecciones aprendidas**:
1. Las operaciones largas en plugins de Figma llevan timeout
2. `Promise.race` limita bien el tiempo de una operación asíncrona
3. Los errores deben ayudar a salir del problema (p. ej., "intenta simplificar el nodo")
4. El logging detallado ayuda en producción
5. Un tick separado (setTimeout(fn, 0)) deja la UI viva

**Impacto en otras herramientas**:
Este patrón vale para `create_component_instance` y `set_effect_style_id`, y para toda la base de código.

## 3. Herramienta `create_component_instance` - RESUELTO ✅

**Fecha de solución**: 4 de mayo de 2025

**Problema detectado**:
En las pruebas de `create_component_instance`:

1. **Cuelgues**: Importar componentes complejos o remotos podía colgarse
2. **Sin timeout**: Nada limitaba la espera
3. **Errores pobres**: Sin contexto para diagnosticar lo común

**Solución implementada**:
`createComponentInstance` en `code.js` gana:

1. **Sistema de timeout**: 
   - Timeout de 10 segundos con `Promise.race()`
   - Corta los cuelgues cuando un componente falla
   - Los timeouts se limpian, sin fugas

2. **Separación de la lógica**:
   - Dos fases: importación y creación de instancia
   - Así el error señala su fase

3. **Mensajes de error enriquecidos**:
   - Mensajes por tipo de error
   - Sugerencias de acción para el usuario
   - Categorías: timeout, componente no encontrado, permisos, etc.

4. **Logging mejorado**:
   - Logs detallados
   - Registra inicio y fin de la importación

**Detalles de Implementación**:
El núcleo: promesas en competencia (`Promise.race`) con límite de tiempo:

```javascript
// Set up a manual timeout to detect long operations
let timeoutId;
const timeoutPromise = new Promise((_, reject) => {
  timeoutId = setTimeout(() => {
    reject(new Error("Timeout while creating component instance (10s)..."));
  }, 10000); // 10 seconds timeout
});

// Execute the import with a timeout
const importPromise = figma.importComponentByKeyAsync(componentKey);

// Use Promise.race to implement the timeout
const component = await Promise.race([importPromise, timeoutPromise])
  .finally(() => {
    clearTimeout(timeoutId); // Prevent memory leaks
  });
```

Para el diagnóstico, detección del tipo de error:

```javascript
// Mensajes según el tipo de error
if (error.message.includes("timeout") || error.message.includes("Timeout")) {
  throw new Error(`The component import timed out after 10 seconds...`);
} else if (error.message.includes("not found") || error.message.includes("Not found")) {
  throw new Error(`Component with key "${componentKey}" not found...`);
} else if (error.message.includes("permission") || error.message.includes("Permission")) {
  throw new Error(`You don't have permission to use this component...`);
} 
```

**Beneficios de la solución**:
1. **Sin cuelgues**
2. **Diagnóstico**: El error dice qué falla
3. **Sugerencias**: El usuario sabe por dónde salir
4. **Robustez**: Los errores no la tiran

**Pruebas y Validación**:
- Probada con componentes locales
- Timeout validado con componentes problemáticos
- Mensajes de error comprobados

**Impacto en el Código**:
El cambio queda contenido y no toca el resto. Es el mismo patrón de `flattenNode`.

**Lecciones aprendidas**:
Principios que refuerza:

1. Toda operación asíncrona lleva timeout
2. Los errores deben ser concretos y apuntar a la salida
3. Partir las operaciones complejas ayuda a diagnosticar
4. Liberar recursos, sin fugas

El patrón vale para cualquier herramienta costosa o con riesgo de cuelgue.

## 4. Herramienta `set_effect_style_id` - RESUELTO ✅

**Fecha de solución**: 4 de mayo de 2025

**Problema detectado**:
`set_effect_style_id` tenía estos problemas:

1. **Lentitud**: Aplicar un estilo de efecto pesa, sobre todo en nodos complejos o con efectos elaborados.

2. **Sin timeout**: Nada limitaba la espera, y eso daba:
   - Cuelgues del plugin
   - Fallos silenciosos, sin aviso al usuario
   - Un servidor MCP impredecible

3. **Poca validación**: No se comprobaba que el estilo existiera antes de aplicarlo.

4. **Errores pobres**: Al fallar, el mensaje no ayudaba a diagnosticar.

**Solución implementada**:
La versión nueva de `setEffectStyleId`:

```javascript
async function setEffectStyleId(params) {
  const { nodeId, effectStyleId } = params || {};
  
  if (!nodeId) {
    throw new Error("Missing nodeId parameter");
  }
  
  if (!effectStyleId) {
    throw new Error("Missing effectStyleId parameter");
  }
  
  try {
    // Timeout manual contra operaciones largas
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Timeout while setting effect style ID (8s). The operation took too long to complete."));
      }, 8000); // 8 seconds timeout
    });
    
    console.log(`Starting to set effect style ID ${effectStyleId} on node ${nodeId}...`);
    
    // Nodo y validación en una promesa
    const nodePromise = (async () => {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node) {
        throw new Error(`Node not found with ID: ${nodeId}`);
      }
      
      if (!("effectStyleId" in node)) {
        throw new Error(`Node with ID ${nodeId} does not support effect styles`);
      }
      
      // Comprobar que el estilo existe antes de aplicarlo
      console.log(`Fetching effect styles to validate style ID: ${effectStyleId}`);
      const effectStyles = await figma.getLocalEffectStylesAsync();
      const foundStyle = effectStyles.find(style => style.id === effectStyleId);
      
      if (!foundStyle) {
        throw new Error(`Effect style not found with ID: ${effectStyleId}. Available styles: ${effectStyles.length}`);
      }
      
      console.log(`Effect style found, applying to node...`);
      
      // Aplicar el estilo al nodo
      node.effectStyleId = effectStyleId;
      
      return {
        id: node.id,
        name: node.name,
        effectStyleId: node.effectStyleId,
        appliedEffects: node.effects
      };
    })();
    
    // Carrera entre la operación y el timeout
    const result = await Promise.race([nodePromise, timeoutPromise])
      .finally(() => {
        // Limpiar el timeout, sin fugas
        clearTimeout(timeoutId);
      });
    
    console.log(`Successfully set effect style ID on node ${nodeId}`);
    return result;
  } catch (error) {
    console.error(`Error setting effect style ID: ${error.message || "Unknown error"}`);
    console.error(`Stack trace: ${error.stack || "Not available"}`);
    
    // Mensajes de error por caso
    if (error.message.includes("timeout") || error.message.includes("Timeout")) {
      throw new Error(`The operation timed out after 8 seconds. This could happen with complex nodes or effects. Try with a simpler node or effect style.`);
    } else if (error.message.includes("not found") && error.message.includes("Node")) {
      throw new Error(`Node with ID "${nodeId}" not found. Make sure the node exists in the current document.`);
    } else if (error.message.includes("not found") && error.message.includes("style")) {
      throw new Error(`Effect style with ID "${effectStyleId}" not found. Make sure the style exists in your local styles.`);
    } else if (error.message.includes("does not support")) {
      throw new Error(`The selected node type does not support effect styles. Only certain node types like frames, components, and instances can have effect styles.`);
    } else {
      throw new Error(`Error setting effect style ID: ${error.message}`);
    }
  }
}
```

### Características clave de la solución:

1. **Sistema de timeout robusto**: 
   - Timeout de 8 segundos con `Promise.race`
   - `.finally()` limpia el timeout, sin fugas

2. **Validación previa**:
   - Comprueba que el nodo existe antes de aplicar
   - Comprueba que el nodo soporta estilos de efecto
   - Comprueba que el estilo existe con `figma.getLocalEffectStylesAsync()`

3. **Mensajes de error específicos**:
   - Errores por categoría
   - Sugerencias por tipo de error
   - Detalle para depurar

4. **Registro mejorado**:
   - Logs detallados
   - Registra la pila de llamadas en los errores

**Motivos de la Implementación**

El mismo patrón que en las otras tres herramientas:

1. **Consistencia**: Un solo trato para las operaciones lentas.

2. **Robustez**: La herramienta nunca se cuelga.

3. **Usuario**: Aviso claro cuando algo falla.

4. **Mantenibilidad**: Un patrón común se mantiene mejor.

**Beneficios de la Solución**

Ventajas:

1. **Sin cuelgues**.

2. **Diagnóstico**: Errores concretos.

3. **Transparencia**: Logs con detalle.

4. **Recursos**: Timeouts limpios, sin fugas.

**Validación**

Probada en varios escenarios:

- Estilos válidos sobre nodos compatibles
- Estilos sobre nodos inexistentes
- Estilos inexistentes
- Estilos sobre nodos sin soporte de efectos

En todos los casos responde con un resultado o con un error claro.

**Conclusión**

Con esto quedan corregidas las cuatro herramientas con problemas de timeout, todas con el mismo patrón. `set_effect_style_id` aguanta condiciones adversas y trata mejor al usuario.

## Estrategia general para implementaciones futuras

Para lo pendiente y lo futuro:

1. **Errores**: Excepciones, no objetos de error a medida
2. **Timeouts**: En toda operación que pueda colgarse
3. **Validación**: Comprobar parámetros y APIs antes de usarlas
4. **Logging**: Registrar lo que ayude a depurar
5. **Progreso**: Las operaciones largas avisan de su avance
6. **No bloquear**: Lo pesado va en promesas aparte, con la UI viva
7. **Limpieza**: Liberar todos los recursos, timeouts incluidos

Así el código queda uniforme y el plugin aguanta más.