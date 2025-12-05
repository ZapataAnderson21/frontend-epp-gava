/**
 * Configuración centralizada de variables de entorno
 * 
 * Todas las variables de entorno deben accederse a través de este archivo
 * para facilitar el mantenimiento y evitar errores de tipeo.
 */

export const config = {
  // API REST
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3001/",
  
  // WebSocket
  wsUrl: import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3001",
  
  // Ambiente
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

// Tipos para autocompletado
export type Config = typeof config;
