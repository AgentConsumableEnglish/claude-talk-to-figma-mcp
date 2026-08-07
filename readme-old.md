<img src="images/claude-talk-to-figma.png" alt="Claude Talk to Figma collage" />

# Claude Talk to Figma MCP

A Model Context Protocol (MCP) plugin that lets Claude Desktop and other AI tools (GitHub Copilot, Cursor, etc.) work in Figma, so an AI can help you design.

> **Important**: This project builds on [cursor-talk-to-figma-mcp](https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp) by Sonny Lazuardi, adapted for Claude Desktop instead of Cursor, with more modification tools. The original implementation and main credit belong to Sonny Lazuardi ❤️

## 🚀 Features

- **Native Claude Integration**: Claude talks to Figma through the Model Context Protocol (MCP)
- **Powerful Commands**: Handle objects in Figma, read information, create and change elements
- **Advanced Text & Font Control**: Text styling — font selection, spacing, and text effects
- **Bidirectional Communication**: A live WebSocket channel between Claude and Figma
- **Fluid Experience**: Design with AI at your side
- **Text Scanning**: Find and change text nodes in Figma documents
- **Remote Components**: Use components from team libraries
- **Modular Architecture**: Separate tool modules, each with one job
- **Enhanced Error Handling**: Timeouts and error recovery
- **Performance Optimizations**: Chunking and batching for long operations

## 📋 Prerequisites

- [Claude Desktop](https://claude.ai/download)
- [Figma Desktop](https://www.figma.com/downloads/)
- [Figma](https://figma.com) account
- [Bun](https://bun.sh) v1.0.0 or higher
  - Linux macOS ```curl -fsSL https://bun.sh/install | bash```
  - Windows ```powershell -c "irm bun.sh/install.ps1 | iex"```

## ⚙️ Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/arinspunk/claude-talk-to-figma-mcp.git
   cd claude-talk-to-figma-mcp
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Build the project:
   ```bash
   bun run build
   ```

4. Configure the MCP in Claude Desktop:
   ```bash
   bun run configure-claude
   ```
   Restart Claude Desktop if it was open.

   > **Note**: This script:

   - Finds the Claude Desktop configuration file:
     - On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
     - On Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Backs up the existing configuration
   - Adds "ClaudeTalkToFigma" to the list of MCPs
   - Sets the command Claude Desktop runs to start the MCP

5. Install the Figma plugin:

   > **Note**: The plugin lives in the `src/claude_mcp_plugin` folder.

   - Open Figma
   - Go to **Menu > Plugins > Development**
   - Select "Import plugin from manifest"
   - Select `src/claude_mcp_plugin/src/claude_mcp_plugin/manifest.json` from this repository

   The plugin appears in your development plugins list, ready to use like any other.

## 🚀 Usage

### 🔌 Starting Up

Once installed, start it:

1. **Start the WebSocket server**:
   ```bash
   bun socket
   ```
   Check it runs at `http://localhost:3055/status`

   > **Note**: to stop the server, press `Ctrl+C` in the terminal.

3. **Connect the plugin to the server**:

   Open the Claude MCP Plugin in Figma and copy the channel ID for Claude.

   <img src="images/mcp-figma-plugin-configuration.png" width="300" alt="Figma Plugin Configuration" />

4. **Claude Desktop**:

   Open Claude Desktop and check "ClaudeTalkToFigma" appears in the MCPs selector.

5. **Ready to use!**

   Now you can send commands to Figma from Claude.

### 🧠 Prompting

1. Before you design with Claude, [make it an expert in UX/UI](prompts/prompt-ux-ui-specialist.md) 🎨

   > **Note**: Also in [Galician](prompts/prompt-ux-ui-especialista-gal.md), [Português](prompts/prompt-ux-ui-especialista-pt.md) and [Español](prompts/prompt-ux-ui-especialista-es.md).

2. Now tell Claude to connect to your Figma project:
   ```
   Talk to Figma, channel {channel-ID}
   ```

## 🏛️ Architecture

```
+----------------+     +-------+     +---------------+     +---------------+
|                |     |       |     |               |     |               |
| Claude Desktop |<--->|  MCP  |<--->| WebSocket Srv |<--->| Figma Plugin  |
|   (AI Agent)   |     |       |     |  (Port 3055)  |     |  (UI Plugin)  |
|                |     |       |     |               |     |               |
+----------------+     +-------+     +---------------+     +---------------+
```

### Design Principles

Each part has one job:

- **MCP Server**: Business logic, validation, and default values
- **WebSocket Server**: Routes messages between components
- **Figma Plugin**: Translates commands and runs them in Figma

One responsibility per layer makes the system steadier and easier to maintain.

### Project Structure

```
src/
  talk_to_figma_mcp/     # MCP Server implementation
    server.ts            # Main entry point
    config/              # Server configuration
    tools/               # Tool categories by function
      index.ts           # Tool registration
      document-tools.ts  # Document interaction tools
      creation-tools.ts  # Shape and element creation tools
      modification-tools.ts # Property modification tools
      text-tools.ts      # Text manipulation tools
      component-tools.ts # Component handling tools
    utils/               # Shared utilities and helpers
      defaults.ts        # Safe default value handling
      websocket.ts       # WebSocket communication
      logger.ts          # Logging system
      figma-helpers.ts   # Figma-specific helpers
    types/               # TypeScript type definitions
      color.ts           # Color type definitions
  claude_mcp_plugin/     # Figma plugin
    code.js              # Plugin implementation
    manifest.json        # Plugin configuration
    ui.html              # Plugin UI
```

What this structure buys:
- **Clear ownership**: Each component has its own job
- **Easy testing**: Components test alone
- **Maintainable**: A change to one layer leaves the others alone

## 🛠️ Available Commands

Claude, connected to our MCP, already knows the tools for Figma. But you can name them in your prompts:

### Document Tools
- `get_document_info`: Get information about the current Figma document
- `get_selection`: Get the current selection in Figma
- `get_node_info`: Get information about one node in Figma
- `get_nodes_info`: Get information about several nodes in Figma
- `get_styles`: Get all styles from the current Figma document
- `get_local_components`: Get all local components from the Figma document
- `get_remote_components`: Get components from team libraries in Figma
- `scan_text_nodes`: Scan all text nodes in the selected Figma node
- `join_channel`: Join a channel to talk to Figma
- `export_node_as_image`: Export a node as an image from Figma

### Creation Tools
- `create_rectangle`: Create a rectangle in Figma
- `create_frame`: Create a frame in Figma
- `create_text`: Create a text element in Figma
- `create_ellipse`: Create an ellipse or circle in Figma
- `create_polygon`: Create a polygon with any number of sides in Figma
- `create_star`: Create a star with any number of points in Figma
- `create_vector`: Create a vector shape in Figma
- `create_line`: Create a line in Figma
- `group_nodes`: Group nodes in Figma
- `ungroup_nodes`: Ungroup nodes in Figma
- `clone_node`: Clone a node in Figma
- `insert_child`: Insert a child node inside a parent node in Figma
- `flatten_node`: Flatten a node in Figma (e.g., for boolean operations)

### Modification Tools
- `set_fill_color`: Set the fill color of a node in Figma
- `set_stroke_color`: Set the stroke color of a node in Figma
- `move_node`: Move a node in Figma
- `resize_node`: Resize a node in Figma
- `delete_node`: Delete a node from Figma
- `set_corner_radius`: Set the corner radius of a node in Figma
- `set_auto_layout`: Set auto layout properties for a node in Figma
- `set_effects`: Set visual effects (shadows, blurs) for a node in Figma
- `set_effect_style_id`: Apply an effect style to a node in Figma

### Text Tools
- `set_text_content`: Set the text of an existing text node in Figma
- `set_multiple_text_contents`: Set several text contents at once in a node
- `set_font_name`: Set the font name and style of a text node in Figma
- `set_font_size`: Set the font size of a text node in Figma
- `set_font_weight`: Set the font weight of a text node in Figma
- `set_letter_spacing`: Set the letter spacing of a text node in Figma
- `set_line_height`: Set the line height of a text node in Figma
- `set_paragraph_spacing`: Set the paragraph spacing of a text node in Figma
- `set_text_case`: Set the text case of a text node in Figma
- `set_text_decoration`: Set the text decoration of a text node in Figma
- `get_styled_text_segments`: Get text segments with specific styling in a text node
- `load_font_async`: Load a font asynchronously in Figma

### Component Tools
- `create_component_instance`: Create an instance of a component in Figma

## 📝 CHANGELOG

See [CHANGELOG.md](CHANGELOG.md) for the history of changes.

### Current version: 0.5.2

- **Critical Bug Fixes**: `set_stroke_color` no longer converts falsy opacity and stroke weight values
- **Architectural Improvements**: Safe defaults across all color operations, with the MCP/Plugin split kept clean
- **Enhanced Testing**: Test coverage for stroke operations and edge cases
- **Code Quality**: Better type safety, validation, and error handling

For earlier changes, see the [CHANGELOG.md](CHANGELOG.md).

## 🐛 Troubleshooting

If something breaks, check these first:

### Common Issues

- **Connection Error**: Check the WebSocket server runs with `bun socket`
- **Plugin Not Appearing**: Check you linked the plugin folder in Figma Development settings
- **Claude Can't Find the MCP**: Check you ran `bun run configure-claude` and restarted Claude Desktop
- **Claude Not Responding**: Check you selected "ClaudeTalkToFigma" in the MCPs menu
- **Execution Errors**: The Figma development console holds the details
- **Font Loading Issues**: Some fonts may be missing in Figma. Use `load_font_async` to check
- **Remote Components Error**: Team libraries may need permissions in Figma. Check you can reach the libraries you use

## 🧪 Testing

The project tests two ways:

### Automated Tests

Unit and component integration tests:

```bash
bun run test            # Run all automated tests
bun run test:watch      # Run tests in watch mode
bun run test:coverage   # Run tests with coverage report
```

### Manual Integration Tests

End-to-end tests across Claude, the WebSocket server, and Figma:

```bash
bun run test:integration
```

This script walks you through the whole workflow.

For more on testing, see [TESTING.md](TESTING.md).

## 🤝 Contributions

Contributions are welcome. Follow these steps:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contributors

- **[Taylor Smits](https://github.com/smitstay)** - Fixed opacity handling in color functions and added automated tests ([PR #13](https://github.com/arinspunk/claude-talk-to-figma-mcp/pull/13), [PR #14](https://github.com/arinspunk/claude-talk-to-figma-mcp/pull/14))

## 📄 License

This project is under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Xúlio Zé** - *Adaptation for Claude* - [GitHub](https://github.com/arinspunk)
- **Sonny Lazuardi** - *Original Cursor implementation* - [GitHub](https://github.com/sonnylazuardi)

## 🙏 Acknowledgments

- Anthropic team for Claude and the Model Context Protocol
- Figma community for the plugin API
- Sonny Lazuardi for the original Cursor Talk to Figma MCP
- Bun team for the fast JavaScript runtime
