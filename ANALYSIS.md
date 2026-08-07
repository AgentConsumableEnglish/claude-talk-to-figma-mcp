# Análisis del Proyecto: Claude Talk to Figma MCP

## 🛠 Stack Técnico

Las tecnologías y herramientas del proyecto:

*   **Lenguaje Principal**: TypeScript (todo el código del servidor y las herramientas).
*   **Runtime & Package Manager**:
    *   **Bun**: desarrollo local, scripts, instalación de dependencias y servidor WebSocket.
    *   **Node.js**: ejecuta el servidor MCP (sobre todo en la distribución DXT) y los scripts de compatibilidad.
*   **Framework MCP**: `@modelcontextprotocol/sdk` (SDK oficial).
*   **Comunicación en Tiempo Real**:
    *   `ws`: biblioteca WebSocket para la comunicación en ambos sentidos.
    *   `Bun.serve`: servidor HTTP/WS rápido de Bun.
*   **Validación**: `zod` (esquemas y argumentos de herramientas).
*   **Build System**: `tsup` (empaqueta TypeScript a JS).
*   **Testing**: `jest` (unit testing) y scripts propios para integración.
*   **Distribución**: `dxt` (empaquetador de extensiones de Anthropic).
*   **Figma Plugin**: JavaScript (ES6+), HTML (interfaz UI del plugin).

---

## 🔍 Análisis en Profundidad

Este proyecto tiende un puente que deja a modelos de IA (como Claude) manejar Figma
directamente. A diferencia de una integración por API REST, usa un *relay* en tiempo
real para operar dentro de Figma.

### 🏗 Arquitectura del Sistema

Tres componentes separados que trabajan juntos:

1.  **Servidor MCP (`src/talk_to_figma_mcp`)**:
    *   Es la cara ante el asistente de IA (Claude).
    *   Define las herramientas disponibles (`create_rectangle`, `get_document_info`, etc.).
    *   Recibe las instrucciones de la IA como llamadas de función.
    *   No cambia nada en Figma: reenvía todo al servidor WebSocket.

2.  **Servidor WebSocket (Relay) (`src/socket.ts`)**:
    *   Reparte los mensajes.
    *   Escucha en el puerto `3055`.
    *   Mantiene los canales. El plugin de Figma se une a un canal y el servidor MCP manda comandos a ese canal.
    *   Deja que la comunicación salga del sandbox del navegador o de la aplicación de escritorio de Figma.

3.  **Plugin de Figma (`src/claude_mcp_plugin`)**:
    *   **`manifest.json`**: define el plugin dentro de Figma.
    *   **`ui.html`**: lleva el cliente WebSocket. Figma no permite WebSockets en el hilo principal (`code.js`), así que un iframe invisible (`ui.html`) mantiene la conexión.
    *   **`code.js`**: el hilo principal, con acceso a la API de Figma (`figma.createRectangle`, etc.). Recibe mensajes de `ui.html` y ejecuta las acciones.

### 🔄 Flujo de Datos

1.  **Usuario** pide a Claude: "Dibuja un botón azul".
2.  **Claude** llama a la herramienta: `create_rectangle({ name: "Button", fills: [...] })`.
3.  **MCP Server** valida la petición y la manda por WebSocket al canal activo.
4.  **Socket Server** recibe el mensaje y lo pasa al cliente conectado (plugin de Figma).
5.  **Figma Plugin (UI)** recibe el evento por socket y lo pasa al hilo `code.js`.
6.  **Figma Plugin (Logic)** ejecuta `figma.createRectangle()` sobre el documento real.
7.  **Respuesta**: el éxito o el error vuelve por la misma cadena hasta Claude.

### 💡 Puntos Destacados

*   **Soporte DXT & Distribución**: el proyecto ya soporta el formato `.dxt` de Anthropic, que instala en Claude Desktop casi como una extensión nativa ("one-click install").
*   **Salida del Sandbox**: un servidor WebSocket local salta las restricciones de las APIs web estáticas y permite manejar una aplicación de escritorio en tiempo real.
*   **Manejo de Errores y Logs**: hay un buen sistema de logging (véase `socket.ts`) para depurar la conexión, necesario con tres saltos de red.
*   **Testing**: hay tests unitarios con Jest y tests de integración (`scripts/test-integration.js`) para validar la cadena completa.

### ⚠️ Consideraciones de Mantenimiento

*   Las definiciones de herramientas del lado MCP y su implementación en el plugin de Figma deben ir a la par. Cambiar una API obliga a cambiar la otra.
*   Depender de un puerto local (`3055`) puede chocar con otros servicios del usuario, aunque es lo normal en este tipo de puentes.
