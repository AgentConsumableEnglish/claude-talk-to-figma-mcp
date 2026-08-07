# Análisis del Proyecto Claude Talk to Figma MCP

## Resumen General

El proyecto comunica Claude (un asistente de IA) con Figma mediante el Model Context Protocol (MCP). Dos componentes:

1. **Servidor MCP** (`talk_to_figma_mcp/`): Un servidor Node.js/Bun que habla MCP y da a Claude herramientas para Figma.

2. **Plugin de Figma** (`claude_mcp_plugin/`): Une el servidor MCP con la aplicación de Figma.

## Arquitectura del Sistema

Así funciona:

1. Claude se comunica con el servidor MCP usando el protocolo MCP.
2. El servidor MCP envía comandos al plugin de Figma a través de WebSockets.
3. El plugin recibe los comandos, los ejecuta y devuelve los resultados.
4. El servidor MCP los procesa y se los devuelve a Claude en un formato que entiende.

## Componentes Principales

### 1. Servidor MCP (`talk_to_figma_mcp/server.ts`)

El punto de entrada. Se encarga de:

- Iniciar un servidor MCP con `@modelcontextprotocol/sdk`.
- Registrar las herramientas para Claude.
- Mantener la conexión WebSocket con el plugin.
- Pasar los comandos de Claude a Figma.
- Manejar respuestas y errores.

### 2. Utilidades WebSocket (`talk_to_figma_mcp/utils/websocket.ts`)

Lleva la comunicación entre servidor y plugin:

- Mantiene la conexión WebSocket.
- Reconecta sola, con backoff exponencial.
- Envía comandos y recibe respuestas.
- Maneja timeouts y errores de conexión.
- Sigue las solicitudes pendientes.

### 3. Herramientas de Figma (Directorio `talk_to_figma_mcp/tools/`)

Las herramientas van por categorías:

- **document-tools.ts**: Documento actual, selecciones, nodos, estilos y componentes.
- **creation-tools.ts**: Crear rectángulos, marcos, texto, elipses, polígonos y estrellas.
- **modification-tools.ts**: Relleno, borde, posición, tamaño, efectos y auto-layout.
- **text-tools.ts**: Texto: contenido, formato, espaciado.
- **component-tools.ts**: Componentes de Figma.

### 4. Plugin de Figma (`claude_mcp_plugin/`)

- **manifest.json**: Propiedades del plugin: permisos, dominios y tipo de acceso.
- **code.js**: Recibe y ejecuta los comandos del servidor MCP.
- **ui.html**: Interfaz de usuario del plugin.

### 5. Tipos y Utilidades Adicionales

- **types/index.ts**: Interfaces de comandos, respuestas y mensajes.
- **utils/figma-helpers.ts**: Utilidades para objetos de Figma.
- **utils/logger.ts**: Logging para depurar.

## Características Principales

1. **API amplia**: Más de 30 comandos, desde crear formas y mover elementos hasta texto con estilos y efectos.

2. **Comunicación robusta**: Errores, reintentos y timeouts para una conexión estable.

3. **Validación**: Zod valida los parámetros de cada herramienta.

4. **Asincronía**: Sigue las solicitudes asíncronas y su estado.

5. **Operaciones complejas**: Escanear nodos de texto, cambios en lote, componentes.

## Tecnologías Utilizadas

- **Bun/Node.js**: Como runtime para el servidor.
- **TypeScript**: Tipos estáticos, mejor DX.
- **MCP SDK**: El protocolo MCP.
- **WebSockets**: Comunicación en tiempo real servidor-plugin.
- **Zod**: Validación de esquemas.
- **Figma Plugin API**: El acceso a Figma.

## Estructura de Archivos

Organización modular:

```
src/
  talk_to_figma_mcp/         # Servidor MCP
    server.ts                # Punto de entrada principal
    config/                  # Configuración del servidor
    utils/                   # Utilidades (websocket, logger, etc.)
    tools/                   # Herramientas para interactuar con Figma
    types/                   # Definiciones de tipos
    prompts/                 # Prompts para Claude
  claude_mcp_plugin/         # Plugin de Figma
    manifest.json           # Configuración del plugin
    code.js                 # Código principal del plugin
    ui.html                 # Interfaz de usuario
```

## Observaciones y Consideraciones

1. **Errores**: El sistema aguanta fallos de conexión y timeouts.

2. **Modularidad**: Fácil de extender y mantener.

3. **Documentación**: Comentarios que explican cada componente.

4. **Compatibilidad**: Funciona con Figma y con FigJam.

5. **Empaquetado**: Trae configuración para empaquetar y distribuir.

## Áreas de Potencial Mejora

1. **Pruebas**: Faltan pruebas automatizadas más completas.

2. **Documentación de usuario**: Mejorable.

3. **Estado**: El estado entre comandos pide refuerzo.

4. **Rendimiento**: Las operaciones con muchos nodos pueden ir más rápido.

5. **Capacidades**: Espacio para crecer en:
   - Alineación avanzada
   - Capas complejas
   - Más integraciones con sistemas de diseño

Hasta aquí la visión general del proyecto: arquitectura, componentes y técnica.