# Propuesta de Refactorización para server.ts

## 📋 Resumen de la Propuesta

`server.ts` pasa de 2500 líneas y cuesta mantenerlo y entenderlo. La propuesta: partir el código en módulos pequeños, sin cambiar lo que hace ni añadir nada.

## 🔍 Análisis del Código Actual

El archivo `server.ts` contiene:

1. Configuración del servidor MCP
2. Múltiples definiciones de herramientas (tools)
3. Funciones auxiliares para el manejo de WebSockets
4. Lógica de conexión y comunicación con Figma
5. Definición de prompts
6. Manejo de errores y tipos

Este monolito estorba para navegar, mantener y ampliar.

## 🧩 Estructura Propuesta

Propongo estos módulos:

```
src/talk_to_figma_mcp/
├── server.ts                  # Punto de entrada principal (reducido)
├── config/
│   └── config.ts              # Configuración y argumentos de línea de comandos
├── types/
│   └── index.ts               # Definiciones de tipos e interfaces
├── utils/
│   ├── logger.ts              # Funciones de logging
│   ├── figma-helpers.ts       # Funciones auxiliares para Figma (filterFigmaNode, etc.)
│   └── websocket.ts           # Manejo de WebSocket (conectar, enviar comandos)
├── tools/
│   ├── index.ts               # Exporta todas las herramientas
│   ├── document-tools.ts      # Herramientas de información del documento
│   ├── selection-tools.ts     # Herramientas relacionadas con la selección
│   ├── creation-tools.ts      # Herramientas para crear elementos (rectángulos, marcos, etc.)
│   ├── modification-tools.ts  # Herramientas para modificar elementos
│   ├── text-tools.ts          # Herramientas para texto
│   ├── component-tools.ts     # Herramientas para componentes
│   ├── style-tools.ts         # Herramientas para estilos
│   ├── effects-tools.ts       # Herramientas para efectos
│   └── export-tools.ts        # Herramientas de exportación
└── prompts/
    └── index.ts               # Definiciones de prompts
```

## ⚙️ Plan de Implementación 

### 1. Crear la estructura de directorios ✅

```bash
mkdir -p src/talk_to_figma_mcp/{config,types,utils,tools,prompts}
```

### 2. Extraer Tipos y Configuración ✅

**types/index.ts:**
```typescript
// Interfaces para respuestas de Figma
export interface FigmaResponse {
  id: string;
  result?: any;
  error?: string;
}

// Actualizaciones de progreso
export interface CommandProgressUpdate {
  type: 'command_progress';
  commandId: string;
  commandType: string;
  status: 'started' | 'in_progress' | 'completed' | 'error';
  progress: number;
  totalItems: number;
  processedItems: number;
  currentChunk?: number;
  totalChunks?: number;
  chunkSize?: number;
  message: string;
  payload?: any;
  timestamp: number;
}

// Tipos de comandos Figma
export type FigmaCommand =
  | "get_document_info"
  | "get_selection"
  | "get_node_info"
  // ... otros comandos
```

**config/config.ts:**
```typescript
// Configuración y argumentos
import { z } from "zod";

// Argumentos de línea de comandos
const args = process.argv.slice(2);
const serverArg = args.find(arg => arg.startsWith('--server='));
const portArg = args.find(arg => arg.startsWith('--port='));
const reconnectArg = args.find(arg => arg.startsWith('--reconnect-interval='));

export const serverUrl = serverArg ? serverArg.split('=')[1] : 'localhost';
export const defaultPort = portArg ? parseInt(portArg.split('=')[1], 10) : 3055;
export const reconnectInterval = reconnectArg ? parseInt(reconnectArg.split('=')[1], 10) : 2000;

export const WS_URL = serverUrl === 'localhost' ? `ws://${serverUrl}` : `wss://${serverUrl}`;

// Configuración del servidor MCP
export const SERVER_CONFIG = {
  name: "ClaudeTalkToFigmaMCP",
  description: "Claude MCP Plugin for Figma",
  version: "0.4.0",
};
```

### 3. Extraer Utilidades ✅

**utils/logger.ts:**
```typescript
// Logging
export const logger = {
  info: (message: string) => process.stderr.write(`[INFO] ${message}\n`),
  debug: (message: string) => process.stderr.write(`[DEBUG] ${message}\n`),
  warn: (message: string) => process.stderr.write(`[WARN] ${message}\n`),
  error: (message: string) => process.stderr.write(`[ERROR] ${message}\n`),
  log: (message: string) => process.stderr.write(`[LOG] ${message}\n`)
};
```

**utils/figma-helpers.ts:**
```typescript
// Auxiliares para datos de Figma
export function rgbaToHex(color: any): string {
  // Implementación existente
}

export function filterFigmaNode(node: any) {
  // Implementación existente
}

export function processFigmaNodeResponse(result: unknown): any {
  // Implementación existente
}
```

**utils/websocket.ts:**
```typescript
import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { logger } from "./logger";
import { serverUrl, defaultPort, WS_URL, reconnectInterval } from "../config/config";
import { FigmaCommand, FigmaResponse, CommandProgressUpdate } from "../types";

// WebSocket connection and request tracking
let ws: WebSocket | null = null;
let currentChannel: string | null = null;

const pendingRequests = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
  lastActivity: number;
}>();

// Conectar con Figma
export function connectToFigma(port: number = defaultPort) {
  // Implementación existente
}

// Unirse a un canal
export async function joinChannel(channelName: string): Promise<void> {
  // Implementación existente
}

// Enviar comandos a Figma
export function sendCommandToFigma(
  command: FigmaCommand,
  params: unknown = {},
  timeoutMs: number = 30000
): Promise<unknown> {
  // Implementación existente
}
```

### 4. Organizar Herramientas por Categorías ✅

**tools/document-tools.ts:**
```typescript
import { z } from "zod";
import { sendCommandToFigma } from "../utils/websocket";
import { filterFigmaNode } from "../utils/figma-helpers";

// Registrar herramientas en el servidor
export function registerDocumentTools(server: any) {
  // Document Info Tool
  server.tool(
    "get_document_info",
    "Get detailed information about the current Figma document",
    {},
    async () => {
      // Implementación existente
    }
  );

  // Selection Tool
  server.tool(
    "get_selection",
    "Get information about the current selection in Figma",
    {},
    async () => {
      // Implementación existente
    }
  );

  // Node Info Tool
  server.tool(
    "get_node_info",
    "Get detailed information about a specific node in Figma",
    {
      nodeId: z.string().describe("The ID of the node to get information about"),
    },
    async ({ nodeId }) => {
      // Implementación existente
    }
  );

  // Nodes Info Tool
  server.tool(
    "get_nodes_info",
    "Get detailed information about multiple nodes in Figma",
    {
      nodeIds: z.array(z.string()).describe("Array of node IDs to get information about")
    },
    async ({ nodeIds }) => {
      // Implementación existente
    }
  );
}
```

Las demás herramientas van igual, cada una en su archivo.

### 5. Organizar Prompts ✅

**prompts/index.ts:**
```typescript
export function registerPrompts(server: any) {
  // Design Strategy Prompt
  server.prompt(
    "design_strategy",
    "Best practices for working with Figma designs",
    (extra) => {
      // Implementación existente
    }
  );

  // Read Design Strategy Prompt
  server.prompt(
    "read_design_strategy",
    "Best practices for reading Figma designs",
    (extra) => {
      // Implementación existente
    }
  );

  // Text Replacement Strategy Prompt
  server.prompt(
    "text_replacement_strategy",
    "Systematic approach for replacing text in Figma designs",
    (extra) => {
      // Implementación existente
    }
  );
}
```

### 6. Refactorizar el Archivo Principal ✅

**server.ts** (refactorizado):
```typescript
#!/usr/bin/env node

/**
 * Main entry point for the Figma MCP Server
 * This file initializes the server, connects to Figma,
 * and registers all tools and prompts.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import configuration
import { SERVER_CONFIG } from "./config/config";

// Import utilities
import { logger } from "./utils/logger";
import { connectToFigma } from "./utils/websocket";

// Import tools registration function from tools/index.ts
import { registerTools } from "./tools";

// Import prompts registration function from prompts/index.ts
import { registerPrompts } from "./prompts";

/**
 * Initialize and start the MCP server
 */
async function main() {
  try {
    // Create MCP server instance with configuration
    const server = new McpServer(SERVER_CONFIG);
    
    // Register all tools with the server
    registerTools(server);
    
    // Register all prompts with the server
    registerPrompts(server);
    
    // Try to connect to Figma socket server
    try {
      connectToFigma();
    } catch (error) {
      logger.warn(`Could not connect to Figma initially: ${error instanceof Error ? error.message : String(error)}`);
      logger.warn('Will try to connect when the first command is sent');
    }

    // Start the MCP server with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('FigmaMCP server running on stdio');
  } catch (error) {
    logger.error(`Error starting FigmaMCP server: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run the server
main().catch(error => {
  logger.error(`Error starting FigmaMCP server: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
```

## 🔄 Proceso de Migración

Para migrar sin romper nada:

1. Crear la nueva estructura de directorios
2. Mover el código a los nuevos archivos sin cambiar lo que hace
3. Integrar todos los módulos en el nuevo archivo principal
4. Probar a fondo que todo funciona como antes
5. Resolver importaciones y dependencias circulares

## 🏁 Beneficios de la Refactorización

1. **Mantenibilidad**: Archivos pequeños y centrados
2. **Claridad**: Organizado por tipos de herramienta
3. **Extensión**: Añadir herramientas será más fácil
4. **Colaboración**: Varios desarrolladores, cada uno en su módulo
5. **Pruebas**: Unidades pequeñas se prueban mejor

## 🚀 Recomendaciones Adicionales

- Mantener la configuración de compilación actual (tsup.config.ts)
- Actualizar los scripts de build a la nueva estructura
- Pensar en pruebas unitarias por módulo
- Documentar la nueva estructura