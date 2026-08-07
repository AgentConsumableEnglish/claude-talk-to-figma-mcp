#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { SERVER_CONFIG } from "./config/config";

import { logger } from "./utils/logger";
import { connectToFigma } from "./utils/websocket";

import { registerTools } from "./tools";

import { registerPrompts } from "./prompts";

async function main() {
  try {
    const server = new McpServer(SERVER_CONFIG);
    
    registerTools(server);
    
    registerPrompts(server);
    
    try {
      connectToFigma();
    } catch (error) {
      logger.warn(`Could not connect to Figma initially: ${error instanceof Error ? error.message : String(error)}`);
      logger.warn('Will try to connect when the first command is sent');
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('FigmaMCP server running on stdio');
  } catch (error) {
    logger.error(`Error starting FigmaMCP server: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error(`Error starting FigmaMCP server: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

