# Testing Guide for Claude Talk to Figma MCP

How to test this project: automated tests and manual integration tests.

## Testing Approaches

The project tests two ways:

1. **Automated Tests**: Unit and component integration tests with Jest
2. **Manual Integration Tests**: End-to-end tests of the whole Claude-MCP-Figma workflow

## Prerequisites

Before you start, you need:

- Claude Desktop
- A Figma account that can create plugins
- Bun (v1.0.0 or higher)
- Permission to install plugins in Figma

## Automated Tests

### Running Automated Tests

```bash
# Run all automated tests
bun run test

# Run in watch mode (re-runs on file changes)
bun run test:watch

# Run with coverage report
bun run test:coverage
```

### Test Categories

1. **Unit Tests** (`tests/unit/`):
   - Test single functions and utilities alone
   - Check edge cases and error handling
   - Example: `defaults.test.ts` - falsy value handling

2. **Integration Tests** (`tests/integration/`):
   - Test components together
   - Check they work with each other
   - Example: `set-fill-color.test.ts` - opacity handling in fill colors

### Adding New Tests

1. For unit tests:
   - Add a file under `tests/unit/`
   - Name it `*.test.ts` so Jest finds it

2. For integration tests:
   - Add a file under `tests/integration/`
   - Use the fixtures in `tests/fixtures/` for test data

## Manual Integration Tests

These check the whole workflow: Claude Desktop, the MCP server, and Figma.

### Running Integration Tests

```bash
bun run test:integration
```

This script walks you through the tests.

## Test Cases

### 1. Environment Setup

| Test case | Steps | Expected result |
| -------------- | ----- | ------------------ |
| Dependencies installation | Run `bun install` | Installs without errors |
| Claude configuration | Run `bun run configure-claude` | Script runs, reports success |
| Verify configuration | Check `claude_desktop_config.json` | Contains "ClaudeTalkToFigma" |

### 2. WebSocket Server Configuration

| Test case | Steps | Expected result |
| -------------- | ----- | ------------------ |
| Start WebSocket server | Run `bun socket` | Server starts on port 3055 and says so |
| Verify server status | Open `http://localhost:3055/status` | JSON with "running" status and statistics |
| Test reconnection | Stop and restart the server | Client reconnects on its own |

### 3. Figma Plugin Setup

#### Install the Figma Plugin

1. Open Figma and go to **Menu > Plugins > Development > New Plugin**
2. Select "Link existing plugin"
3. Select the folder `src/claude_mcp_plugin` in this repository

#### Connect Plugin to WebSocket Server

1. The plugin asks for a port number (default: 3055)
2. Enter the port your WebSocket server runs on
3. Click "Connect"
4. You should see "Connected to Claude MCP server"

#### Integration Test

To check the plugin talks to the Claude MCP server:

1. Start the WebSocket server
2. Open Figma and run the Claude MCP Plugin from your Development plugins
3. Connect to the WebSocket server
4. Open Claude Desktop and select the "ClaudeTalkToFigma" MCP
5. Try a simple command in Claude: "Can you show me information about my current Figma document?"

Claude should reach Figma and return facts about the document.

### 4. Claude-MCP-Figma Integration Tests

| Test case | Steps | Expected result |
| -------------- | ----- | ------------------ |
| Get document info | Ask Claude about the open document | Claude describes the document |
| Get selection | Select an element in Figma and ask Claude | Claude describes the selected element |
| Create element | Ask Claude to create a rectangle | Rectangle appears in the document |
| Modify element | Ask Claude to change an element's color | The color changes |
| Complex operation | Ask Claude to find text and change it | The text changes across nodes |

## Common Problems and Solutions

### Connection Problems

| Problem | Possible cause | Solution |
| -------- | ------------- | -------- |
| "Cannot connect to WebSocket server" | Server not running | Run `bun socket` |
| "Connection error: port in use" | Port 3055 taken | Free the port or change the config |
| "Cannot connect from plugin" | CORS restrictions | Check the plugin uses the right domain |
| "Connection rejected" | Firewall | Allow port 3055 through the firewall |

### Problems with Claude Desktop

| Problem | Possible cause | Solution |
| -------- | ------------- | -------- |
| "MCP does not appear in Claude Desktop" | Bad configuration | Check the config file and run `bun run configure-claude` |
| "Claude does not respond to Figma commands" | MCP not selected | Select "ClaudeTalkToFigma" in the MCPs menu |
| "Error executing MCP command" | Missing dependencies | Reinstall with `bun install` |
| "Claude cannot execute commands in Figma" | Channel not joined | Check `join_channel` ran |

### Problems with Figma

| Problem | Possible cause | Solution |
| -------- | ------------- | -------- |
| "Plugin does not appear in Figma" | Bad import | Check the path and reimport |
| "Error executing commands in Figma" | Not enough permissions | Check permissions in manifest.json |
| "Cannot modify elements" | Document read-only | Open the document in edit mode |
| "Error creating elements" | Wrong selection | Check the target page or frame is selected |

## Diagnostics and Debugging

### Diagnostic Tools

1. **WebSocket Server Logs**:
   - The terminal running `bun socket` prints the logs
   - Look for ERROR or WARN lines

2. **Status Endpoint**:
   - Open `http://localhost:3055/status` for statistics
   - Check active connections and error counts

3. **Figma Console**:
   - Open the development console in Figma (F12 or Cmd+Option+I)
   - Look for plugin errors

4. **Configuration Verification**:
   - Check `claude_desktop_config.json`

### Systematic Debugging Steps

1. **Verify Individual Components**:
   - The WebSocket server runs
   - The Figma plugin opens
   - Claude Desktop sees the MCP

2. **Test Communication in Parts**:
   - Connect the plugin to the WebSocket directly
   - Check Claude runs basic MCP commands
   - Check commands reach the Figma plugin

3. **Restart Components in Order**:
   - Restart the WebSocket server
   - Reload the plugin in Figma
   - Restart Claude Desktop

4. **Update Versions**:
   - Update all dependencies
   - Check they work with the current Figma

## Comprehensive Testing Checklist

- [ ] Claude Desktop configured
- [ ] WebSocket server running
- [ ] Figma plugin installed and connected
- [ ] Claude Desktop can read document information
- [ ] Claude Desktop can read the current selection
- [ ] Claude Desktop can create elements
- [ ] Claude Desktop can modify elements
- [ ] Claude Desktop can scan and modify text
- [ ] The system recovers from disconnections
- [ ] Errors are handled and reported
- [ ] Automated tests pass
- [ ] Set fill color handles transparency

## Troubleshooting Automated Tests

| Problem | Possible cause | Solution |
| -------- | ------------- | -------- |
| Jest tests fail to run | Missing dependencies | Run `bun install` |
| Test timeouts | Slow machine or heavy CPU load | Raise the timeout in the Jest config |
| Mocks not working | Wrong import paths | Check mock paths match the module paths |
| Type errors in tests | TypeScript configuration | Check `tsconfig.json` and Jest's TypeScript settings |
