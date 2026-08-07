# Análisis del Proyecto claude-talk-to-figma-mcp

## 📋 Resumen del Proyecto

Un plugin de Figma que une Claude AI con Figma mediante el Model Context Protocol (MCP). La comunicación va en ambos sentidos: el asistente de IA lee, cambia y crea diseños en Figma.

## 🏗️ Arquitectura del Sistema

Tres componentes:

1. **Plugin de Figma (claude_mcp_plugin)**: 
   - Corre dentro de Figma
   - Establece una conexión WebSocket con el servidor MCP
   - Expone las APIs de Figma al servidor

2. **Servidor MCP (talk_to_figma_mcp)**:
   - Media entre Claude y Figma
   - Implementa la especificación del Model Context Protocol
   - Da herramientas (tools) que Claude invoca para trabajar en Figma

3. **Cliente WebSocket (socket.ts)**:
   - Lleva la comunicación WebSocket entre el plugin y el servidor MCP
   - Reconecta solo y sigue las solicitudes pendientes

## 🔄 Flujo de Comunicación

```
Claude AI <---> Servidor MCP <---> WebSocket <---> Plugin de Figma <---> API de Figma
```

El flujo de datos:
1. Claude invoca una herramienta del servidor MCP
2. El servidor MCP envía un comando al plugin de Figma a través de WebSocket
3. El plugin ejecuta el comando con la API de Figma
4. El resultado se devuelve al servidor MCP
5. El servidor MCP formatea la respuesta y la devuelve a Claude

## 🧰 Herramientas Disponibles

Las herramientas que el servidor MCP da a Claude:

### Obtención de Información
- `get_document_info`: Información sobre el documento actual
- `get_selection`: Información sobre la selección actual
- `get_node_info`: Información detallada sobre un nodo específico
- `get_nodes_info`: Información sobre múltiples nodos
- `scan_text_nodes`: Escanear todos los nodos de texto
- `get_styles`: Obtener estilos del documento
- `get_local_components`: Obtener componentes locales
- `get_remote_components`: Obtener componentes de bibliotecas de equipos
- `get_styled_text_segments`: Analizar segmentos de texto con estilos específicos

### Creación de Elementos
- `create_rectangle`: Crear un rectángulo
- `create_frame`: Crear un marco
- `create_text`: Crear un elemento de texto
- `create_ellipse`: Crear una elipse
- `create_polygon`: Crear un polígono
- `create_star`: Crear una estrella
- `create_component_instance`: Crear una instancia de componente

### Manipulación de Elementos
- `set_fill_color`: Establecer color de relleno
- `set_stroke_color`: Establecer color de trazo
- `move_node`: Mover un nodo
- `resize_node`: Cambiar tamaño de un nodo
- `delete_node`: Eliminar un nodo
- `clone_node`: Clonar un nodo existente
- `group_nodes`: Agrupar nodos
- `ungroup_nodes`: Desagrupar nodos
- `flatten_node`: Aplanar un nodo
- `insert_child`: Insertar un nodo hijo

### Modificación de Texto
- `set_text_content`: Modificar contenido de texto
- `set_multiple_text_contents`: Modificar múltiples contenidos de texto
- `set_font_name`: Establecer nombre y estilo de fuente
- `set_font_size`: Establecer tamaño de fuente
- `set_font_weight`: Establecer peso de fuente
- `set_letter_spacing`: Establecer espaciado entre letras
- `set_line_height`: Establecer altura de línea
- `set_paragraph_spacing`: Establecer espaciado de párrafo
- `set_text_case`: Establecer caso de texto (mayúsculas, minúsculas, etc.)
- `set_text_decoration`: Establecer decoración de texto (subrayado, tachado)

### Otros
- `set_corner_radius`: Establecer radio de esquina
- `export_node_as_image`: Exportar nodo como imagen
- `load_font_async`: Cargar fuente de forma asíncrona
- `set_auto_layout`: Configurar auto layout
- `set_effects`: Establecer efectos visuales
- `set_effect_style_id`: Aplicar estilo de efecto

## 📚 Prompts y Estrategias

El servidor trae prompts con estrategias y buenas prácticas para Figma:

- `design_strategy`: Buenas prácticas para diseños de Figma
- `read_design_strategy`: Buenas prácticas para leer diseños de Figma
- `text_replacement_strategy`: Método para reemplazar texto en diseños de Figma

## 🔒 Manejo de Errores y Seguridad

- Todas las herramientas controlan sus errores
- Filtra las respuestas de Figma para simplificarlas
- El registro escribe en stderr para que no lo capturen

## 🔌 Configuración y Conexión

- El servidor acepta argumentos de línea de comandos:
  - URL del servidor (`--server`)
  - Puerto (`--port`, predeterminado: 3055)
  - Intervalo de reconexión (`--reconnect-interval`)
- Permite la conexión a WebSocket seguro (WSS) o inseguro (WS)
- Reconecta solo

## 💬 Gestión de Canales

- Se conecta a canales concretos para hablar con Figma
- Claude puede unirse a un canal por cada instancia de Figma

## 📊 Características Avanzadas

- **Procesamiento por Lotes**: Las operaciones sobre muchos nodos (como reemplazar texto) van por lotes
- **Informes de Progreso**: Las operaciones largas informan de su avance
- **Reconexión**: Si el WebSocket cae, el sistema reconecta solo

## 🖥️ Uso Práctico

El sistema sirve para:
1. Analizar diseños existentes de Figma
2. Crear diseños desde instrucciones en lenguaje natural
3. Modificar textos y estilos en todo un documento
4. Extraer información estructurada de diseños de Figma
5. Hacer cambios específicos en elementos de diseño seleccionados

## 🚀 Mejores Usos para Claude

1. **Prototipos**: Prototipos de UI rápidos desde descripciones
2. **Cambios por Lotes**: Actualizar muchos textos o estilos sin perder coherencia
3. **Análisis de Diseño**: Extraer información estructurada de los componentes de UI y sus relaciones
4. **Texto**: Traducir interfaces o adaptar contenido a otros públicos
5. **Mejoras de Diseño**: Sugerir cambios desde principios de diseño y accesibilidad

## 🛠️ Limitaciones Técnicas

1. **Respuestas**: Las respuestas grandes de Figma piden filtrado
2. **Rendimiento**: Las operaciones masivas son lentas y van por lotes
3. **Sincronización**: Los cambios concurrentes en el documento pueden chocar
4. **Latencia**: Muchas operaciones sobre muchos nodos tardan
5. **Tipos de Nodos**: No todos los nodos de Figma (como vectores) están cubiertos