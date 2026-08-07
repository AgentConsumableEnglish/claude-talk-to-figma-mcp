# Backlog del Proceso de Refactorización

Progreso y decisiones de la refactorización de `server.ts` en módulos pequeños.

## Paso 2: Extracción de Tipos y Configuración ✅

### Fecha: 4 de mayo de 2025

### Archivos creados:
1. `/src/talk_to_figma_mcp/types/index.ts`
2. `/src/talk_to_figma_mcp/config/config.ts`

### Cambios realizados:

#### 1. Creación del archivo `types/index.ts`:
- Extraídas todas las interfaces y tipos del archivo original, incluyendo:
  - `FigmaResponse`: Respuestas de Figma
  - `CommandProgressUpdate`: Progreso de comandos
  - `PendingRequest`: Seguimiento de peticiones WebSocket
  - `ProgressMessage`: Mensajes de progreso
  - `FigmaCommand`: Enumera los comandos de Figma soportados
- Los nombres originales se quedan, para facilitar el resto de la refactorización

#### 2. Creación del archivo `config/config.ts`:
- Extraída la configuración del servidor:
  - Procesamiento de argumentos de línea de comandos (`--server`, `--port`, `--reconnect-interval`)
  - Valores de configuración como `serverUrl`, `defaultPort`, y `reconnectInterval`
  - URL de WebSocket (`WS_URL`) basada en el entorno
  - Configuración del servidor MCP (nombre, descripción, versión)
- Una constante `SERVER_CONFIG` agrupa la configuración del servidor MCP

### Decisiones de diseño:
- **Tipos**: Todos en un solo `index.ts`, fáciles de importar
- **Configuración**: Un único lugar para todas las constantes
- **Nombres de exportación**: Sin cambios, para tocar menos código
- **Importaciones**: `zod` se queda en la configuración, como en el original

### Próximos pasos:
- Extraer las utilidades (logger, figma-helpers, websocket)
- Pasar las herramientas a los tipos y configuración extraídos
- Actualizar el archivo principal `server.ts` para importar los nuevos módulos

### Impacto en el código existente:
- Esta fase no cambia lo que hace el código
- Los próximos pasos actualizarán las importaciones
- Con los mismos nombres, el cambio pega menos

## Paso 3: Extracción de Utilidades ✅

### Fecha: 4 de mayo de 2025

### Archivos creados:
1. `/src/talk_to_figma_mcp/utils/logger.ts`
2. `/src/talk_to_figma_mcp/utils/figma-helpers.ts`
3. `/src/talk_to_figma_mcp/utils/websocket.ts`

### Cambios realizados:

#### 1. Creación del archivo `utils/logger.ts`:
- Extraído el logging a stderr:
  - Un objeto `logger` con niveles `info`, `debug`, `warn`, `error` y `log`
  - Todo va a `stderr`, no a `stdout`, para no pisar la comunicación MCP

#### 2. Creación del archivo `utils/figma-helpers.ts`:
- Extraídos los auxiliares para datos de Figma:
  - `rgbaToHex`: RGBA a hexadecimal
  - `filterFigmaNode`: Filtra y simplifica los nodos de Figma
  - `processFigmaNodeResponse`: Procesa respuestas de nodos para el logging
- JSDoc en todas las funciones

#### 3. Creación del archivo `utils/websocket.ts`:
- Extraído el WebSocket:
  - Variables de estado (`ws`, `currentChannel`, `pendingRequests`)
  - `connectToFigma`: Conecta con el servidor de Figma
  - `joinChannel`: Se une a un canal
  - `sendCommandToFigma`: Envía comandos a Figma y maneja las respuestas
  - Nuevo método `getCurrentChannel` para el canal actual
- Manejadores de eventos WebSocket:
  - Eventos `open`, `message`, `error` y `close`
  - Timeouts de conexión y reconexión automática

### Decisiones de diseño:
- **Modularidad**: Cada archivo con su trabajo
- **Encapsulamiento**: El estado (`ws`, `currentChannel`) queda dentro del módulo websocket
- **Documentación**: JSDoc en las funciones principales
- **Tipado**: Usa los tipos del paso anterior
- **Errores**: Mensajes más claros

### Mejoras realizadas:
- Nuevo `getCurrentChannel()`, que el original no tenía
- JSDoc en las funciones
- Importaciones más claras
- Parámetros y retornos tipados

### Próximos pasos:
- Organizar las herramientas por categorías
- Organizar los prompts en un módulo separado
- Refactorizar `server.ts` para usar los nuevos módulos

### Impacto en el código existente:
- Las herramientas pueden importar las utilidades extraídas
- Con el WebSocket aparte, la conexión se puede mockear en los tests
- Con el logger aparte, se puede cambiar el logging sin tocar el resto

## Punto 4: Organizar Herramientas por Categorías ✅ (04-05-2025)

Las herramientas quedan en archivos separados por categoría:

- **document-tools.ts**: Documento, selección y exportación de imágenes
  - `get_document_info`: Obtener información del documento
  - `get_selection`: Obtener selección actual
  - `get_node_info`: Obtener información de un nodo específico
  - `get_nodes_info`: Obtener información de múltiples nodos
  - `get_styles`: Obtener estilos
  - `get_local_components`: Obtener componentes locales
  - `get_remote_components`: Obtener componentes remotos
  - `scan_text_nodes`: Escanear nodos de texto
  - `join_channel`: Unirse a un canal
  - `export_node_as_image`: Exportar nodo como imagen

- **creation-tools.ts**: Crear elementos en Figma
  - `create_rectangle`: Crear rectángulo
  - `create_frame`: Crear frame
  - `create_text`: Crear texto
  - `create_ellipse`: Crear elipse
  - `create_polygon`: Crear polígono
  - `create_star`: Crear estrella
  - `group_nodes`: Agrupar nodos
  - `ungroup_nodes`: Desagrupar nodos
  - `clone_node`: Clonar nodo
  - `insert_child`: Insertar nodo hijo
  - `flatten_node`: Aplanar nodo

- **modification-tools.ts**: Modificar elementos
  - `set_fill_color`: Establecer color de relleno
  - `set_stroke_color`: Establecer color de borde
  - `move_node`: Mover nodo
  - `resize_node`: Redimensionar nodo
  - `delete_node`: Eliminar nodo
  - `set_corner_radius`: Establecer radio de esquina
  - `set_auto_layout`: Configurar auto layout
  - `set_effects`: Establecer efectos
  - `set_effect_style_id`: Aplicar estilo de efecto

- **text-tools.ts**: Texto
  - `set_text_content`: Establecer contenido de texto
  - `set_multiple_text_contents`: Establecer múltiples contenidos de texto
  - `set_font_name`: Establecer nombre de fuente
  - `set_font_size`: Establecer tamaño de fuente
  - `set_font_weight`: Establecer peso de fuente
  - `set_letter_spacing`: Establecer espaciado entre letras
  - `set_line_height`: Establecer altura de línea
  - `set_paragraph_spacing`: Establecer espaciado de párrafo
  - `set_text_case`: Establecer mayúsculas/minúsculas
  - `set_text_decoration`: Establecer decoración de texto
  - `get_styled_text_segments`: Obtener segmentos de texto con estilos
  - `load_font_async`: Cargar fuente asíncronamente

- **component-tools.ts**: Componentes
  - `create_component_instance`: Crear instancia de componente

Un **index.ts** exporta todas las categorías y da una función `registerTools` que registra todo de una vez.

Esta organización permite:
1. Encontrar rápido las herramientas afines
2. Mantener el código afín en un solo lugar
3. Reutilizar lo común entre herramientas parecidas
4. Crecer añadiendo herramientas a su categoría

## Punto 5: Organizar Prompts ✅

### Fecha: 4 de mayo de 2025

### Archivos creados:
1. `/src/talk_to_figma_mcp/prompts/index.ts`

### Cambios realizados:

#### 1. Creación del archivo `prompts/index.ts`:
- Los tres prompts del archivo original:
  - `design_strategy`: Buenas prácticas para diseños de Figma
  - `read_design_strategy`: Buenas prácticas para leer diseños de Figma
  - `text_replacement_strategy`: Método para reemplazar texto en diseños de Figma
- Una función `registerPrompts` registra todos los prompts de una vez
- Funciones individuales por si hace falta registrar un prompt suelto:
  - `registerDesignStrategyPrompt`
  - `registerReadDesignStrategyPrompt`
  - `registerTextReplacementStrategyPrompt`

### Decisiones de diseño:
- **Un archivo**: Todos los prompts juntos, más fáciles de mantener
- **Función unificada**: `registerPrompts` registra todo con una llamada
- **Funciones individuales**: Por si hace falta más flexibilidad
- **Documentación**: JSDoc explica el módulo y sus funciones

### Mejoras realizadas:
- Todos los prompts en un módulo
- Añadir prompts será fácil
- JSDoc

### Próximos pasos:
- Refactorizar `server.ts` para usar los prompts extraídos
- Ver si hacen falta más categorías de prompts cuando crezca
- Estudiar cargar prompts desde archivos externos

### Impacto en el código existente:
- `server.ts` se simplifica al sacar los prompts
- Los prompts hacen exactamente lo mismo
- Añadir prompts queda claro y uniforme

## Punto 6: Refactorizar el Archivo Principal ✅

### Fecha: 4 de mayo de 2025

### Archivos modificados:
1. `/src/talk_to_figma_mcp/server.ts`

### Cambios realizados:

#### 1. Refactorización del archivo `server.ts`:
- El archivo baja de más de 2500 líneas a unas 50
- El nuevo punto de entrada:
  - Importa la configuración desde `config/config.ts`
  - Importa las utilidades desde `utils/logger.ts` y `utils/websocket.ts`
  - Importa la función `registerTools` desde `tools/index.ts`
  - Importa la función `registerPrompts` desde `prompts/index.ts`
  - Inicia el servidor MCP con la configuración importada
  - Registra herramientas y prompts con las funciones importadas
  - Intenta conectar con Figma
  - Inicia el servidor MCP con el transporte stdio

### Decisiones de diseño:
- **Punto de entrada mínimo**: Solo inicia y configura el servidor; el resto vive en los módulos
- **Orden claro**: crear servidor → registrar herramientas → registrar prompts → conectar con Figma → iniciar
- **Errores**: try-catch a varios niveles
- **Documentación**: Comentarios por sección

### Mejoras realizadas:
- **Tamaño**: El archivo principal cae un 98%
- **Claridad**: La estructura y el arranque se entienden mejor
- **Responsabilidades**: Cada parte en su módulo
- **Mantenibilidad**: Un cambio futuro toca su módulo, no el archivo principal

### Próximos pasos:
- Probar a fondo el servidor con la nueva estructura
- Ver si hacen falta scripts de build para la nueva estructura
- Ver si hacen falta pruebas unitarias por módulo
- Actualizar la documentación a la nueva arquitectura

### Impacto en el código existente:
- El servidor se comporta exactamente igual por fuera
- Los clientes no notarán nada
- La nueva estructura hará fáciles las ampliaciones