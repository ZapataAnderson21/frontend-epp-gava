/**
 * Centralized environment configuration.
 *
 * Access environment variables through this file to keep
 * behavior consistent across the app.
 */

const normalizeApiBaseUrl = (url: string): string =>
  url.endsWith("/") ? url : `${url}/`;

const normalizeWsBaseUrl = (url: string): string =>
  url.endsWith("/") ? url.slice(0, -1) : url;

const fallbackApiUrl = "https://sir.gavacyc.com/api/";
const fallbackWsUrl = "https://sir.gavacyc.com";

export const config = {
  // REST API
  apiUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_URL || fallbackApiUrl),

  // WebSocket base URL (without /socket or /socket.io)
  wsUrl: normalizeWsBaseUrl(import.meta.env.VITE_WS_URL || fallbackWsUrl),

  // Environment
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

export type Config = typeof config;
