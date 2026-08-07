# Problema y Solución: Error "Must join a channel before sending commands"

## Problema Identificado

En las pruebas de las herramientas refactorizadas apareció un problema crítico:

- `join_channel` funciona y une a un canal de Figma
- Pero todas las herramientas siguientes fallan con: **"Error getting document info: Must join a channel before sending commands"**

### Análisis del Problema

La causa raíz, tras revisar el código:

1. En `utils/websocket.ts`, `sendCommandToFigma` exige un canal antes de enviar comandos:
   ```typescript
   const requiresChannel = command !== "join";
   if (requiresChannel && !currentChannel) {
     reject(new Error("Must join a channel before sending commands"));
     return;
   }
   ```

2. La herramienta `join_channel` en `document-tools.ts` usaba bien el comando "join":
   ```typescript
   await sendCommandToFigma("join", { channel: channel });
   ```

3. Pero el comando "join" y la variable `currentChannel` no iban a la par:

   - `joinChannel` en `websocket.ts` pone `currentChannel = channelName` al unirse
   - La herramienta `join_channel` llamaba directo a `sendCommandToFigma("join", ...)` en vez de a `joinChannel`
   - El comando "join" corría, pero `currentChannel` quedaba sin actualizar

## Solución Implementada

La solución: cambiar la herramienta `join_channel` para que `currentChannel` se actualice:

```typescript
// Join Channel Tool — corregido
server.tool(
  "join_channel",
  "Join a specific channel to communicate with Figma",
  {
    channel: z.string().describe("The name of the channel to join").default(""),
  },
  async ({ channel }) => {
    try {
      if (!channel) {
        // Sin canal: pedirlo al usuario
        return {
          content: [
            {
              type: "text",
              text: "Please provide a channel name to join:",
            },
          ],
          followUp: {
            tool: "join_channel",
            description: "Join the specified channel",
          },
        };
      }

      // joinChannel en vez de sendCommandToFigma directo,
      // para que currentChannel se actualice
      await joinChannel(channel);
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully joined channel: ${channel}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error joining channel: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);
```

### Cambios Clave Implementados:

1. `await sendCommandToFigma("join", { channel: channel });` pasa a ser `await joinChannel(channel);`
2. `joinChannel` se encarga de:
   - Enviar el comando "join" a Figma
   - Actualizar la variable `currentChannel`
   - Manejar los errores

### Detalles de la Implementación

Los pasos:

1. Se modificó el archivo `src/talk_to_figma_mcp/tools/document-tools.ts`
2. Se importó `joinChannel` desde `../utils/websocket.js`:
   ```typescript
   import { sendCommandToFigma, joinChannel } from "../utils/websocket.js";
   ```
3. La herramienta `join_channel` quedó con la versión corregida

4. También se corrigió otro problema, el de las extensiones en las importaciones:
   - Todas las importaciones relativas llevan ahora `.js`, como piden los módulos TypeScript en "node16" o "nodenext".

## Impacto del Cambio

Con este cambio:
- `currentChannel` se actualiza al unirse a un canal
- Las herramientas siguientes pueden enviar comandos a Figma
- Los canales se manejan igual en todo el código

## Estado de Validación

- [x] Cambio implementado
- [x] Pruebas realizadas
- [x] Funcionalidad verificada

## Lecciones Aprendidas

Este problema enseña:

1. **Encapsulamiento**: El estado del canal debe vivir entero en el módulo websocket.
2. **Consistencia**: Usar siempre las funciones de alto nivel que llevan comunicación y estado.
3. **Responsabilidades**: La herramienta debe usar las utilidades que ya existen.

La modularización hizo visibles las dependencias entre módulos, y eso ayudó a encontrar y arreglar el problema.