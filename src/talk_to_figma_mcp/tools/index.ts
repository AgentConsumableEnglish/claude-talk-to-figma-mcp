import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDocumentTools } from "./document-tools";
import { registerCreationTools } from "./creation-tools";
import { registerModificationTools } from "./modification-tools";
import { registerTextTools } from "./text-tools";
import { registerComponentTools } from "./component-tools";

export function registerTools(server: McpServer): void {
  registerDocumentTools(server);
  registerCreationTools(server);
  registerModificationTools(server);
  registerTextTools(server);
  registerComponentTools(server);
}

export {
  registerDocumentTools,
  registerCreationTools,
  registerModificationTools,
  registerTextTools,
  registerComponentTools
};