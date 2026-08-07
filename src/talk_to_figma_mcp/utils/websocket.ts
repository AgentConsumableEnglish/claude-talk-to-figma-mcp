import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { logger } from "./logger";
import { serverUrl, defaultPort, WS_URL, reconnectInterval } from "../config/config";
import { FigmaCommand, FigmaResponse, CommandProgressUpdate, PendingRequest, ProgressMessage } from "../types";

let ws: WebSocket | null = null;
let currentChannel: string | null = null;

const pendingRequests = new Map<string, PendingRequest>();

export function connectToFigma(port: number = defaultPort) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    logger.info('Already connected to Figma');
    return;
  }

  if (ws && ws.readyState === WebSocket.CONNECTING) {
    logger.info('Connection to Figma is already in progress');
    return;
  }

  if (ws && (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED)) {
    ws.removeAllListeners();
    ws = null;
  }

  const wsUrl = serverUrl === 'localhost' ? `${WS_URL}:${port}` : WS_URL;
  logger.info(`Connecting to Figma socket server at ${wsUrl}...`);
  
  try {
    ws = new WebSocket(wsUrl);
    
    const connectionTimeout = setTimeout(() => {
      if (ws && ws.readyState === WebSocket.CONNECTING) {
        logger.error('Connection to Figma timed out');
        ws.terminate();
      }
    }, 10000);
    
    ws.on('open', () => {
      clearTimeout(connectionTimeout);
      logger.info('Connected to Figma socket server');
      currentChannel = null;
    });

    ws.on("message", (data: any) => {
      try {
        const json = JSON.parse(data) as ProgressMessage;

        if (json.type === 'progress_update') {
          const progressData = json.message.data as CommandProgressUpdate;
          const requestId = json.id || '';

          if (requestId && pendingRequests.has(requestId)) {
            const request = pendingRequests.get(requestId)!;

            request.lastActivity = Date.now();

            clearTimeout(request.timeout);

            request.timeout = setTimeout(() => {
              if (pendingRequests.has(requestId)) {
                logger.error(`Request ${requestId} timed out after extended period of inactivity`);
                pendingRequests.delete(requestId);
                request.reject(new Error('Request to Figma timed out'));
              }
            }, 120000);

            logger.info(`Progress update for ${progressData.commandType}: ${progressData.progress}% - ${progressData.message}`);

            if (progressData.status === 'completed' && progressData.progress === 100) {

              logger.info(`Operation ${progressData.commandType} completed, waiting for final result`);
            }
          }
          return;
        }

        const myResponse = json.message;
        logger.debug(`Received message: ${JSON.stringify(myResponse)}`);
        logger.log('myResponse' + JSON.stringify(myResponse));

        if (
          myResponse.id &&
          pendingRequests.has(myResponse.id) &&
          myResponse.result
        ) {
          const request = pendingRequests.get(myResponse.id)!;
          clearTimeout(request.timeout);

          if (myResponse.error) {
            logger.error(`Error from Figma: ${myResponse.error}`);
            request.reject(new Error(myResponse.error));
          } else {
            if (myResponse.result) {
              request.resolve(myResponse.result);
            }
          }

          pendingRequests.delete(myResponse.id);
        } else {
          logger.info(`Received broadcast message: ${JSON.stringify(myResponse)}`);
        }
      } catch (error) {
        logger.error(`Error parsing message: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    ws.on('error', (error) => {
      logger.error(`Socket error: ${error}`);
    });

    ws.on('close', (code, reason) => {
      clearTimeout(connectionTimeout);
      logger.info(`Disconnected from Figma socket server with code ${code} and reason: ${reason || 'No reason provided'}`);
      ws = null;

      for (const [id, request] of pendingRequests.entries()) {
        clearTimeout(request.timeout);
        request.reject(new Error(`Connection closed with code ${code}: ${reason || 'No reason provided'}`));
        pendingRequests.delete(id);
      }

      const backoff = Math.min(30000, reconnectInterval * Math.pow(1.5, Math.floor(Math.random() * 5)));
      logger.info(`Attempting to reconnect in ${backoff/1000} seconds...`);
      setTimeout(() => connectToFigma(port), backoff);
    });
    
  } catch (error) {
    logger.error(`Failed to create WebSocket connection: ${error instanceof Error ? error.message : String(error)}`);
    setTimeout(() => connectToFigma(port), reconnectInterval);
  }
}

export async function joinChannel(channelName: string): Promise<void> {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error("Not connected to Figma");
  }

  try {
    await sendCommandToFigma("join", { channel: channelName });
    currentChannel = channelName;
    logger.info(`Joined channel: ${channelName}`);
  } catch (error) {
    logger.error(`Failed to join channel: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export function getCurrentChannel(): string | null {
  return currentChannel;
}

export function sendCommandToFigma(
  command: FigmaCommand,
  params: unknown = {},
  timeoutMs: number = 60000
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connectToFigma();
      reject(new Error("Not connected to Figma. Attempting to connect..."));
      return;
    }

    const requiresChannel = command !== "join";
    if (requiresChannel && !currentChannel) {
      reject(new Error("Must join a channel before sending commands"));
      return;
    }

    const id = uuidv4();
    const request = {
      id,
      type: command === "join" ? "join" : "message",
      ...(command === "join"
        ? { channel: (params as any).channel }
        : { channel: currentChannel }),
      message: {
        id,
        command,
        params: {
          ...(params as any),
          commandId: id,
        },
      },
    };

    const timeout = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        logger.error(`Request ${id} to Figma timed out after ${timeoutMs / 1000} seconds`);
        reject(new Error('Request to Figma timed out'));
      }
    }, timeoutMs);

    pendingRequests.set(id, {
      resolve,
      reject,
      timeout,
      lastActivity: Date.now()
    });

    logger.info(`Sending command to Figma: ${command}`);
    logger.debug(`Request details: ${JSON.stringify(request)}`);
    ws.send(JSON.stringify(request));
  });
}