/**
 * Configuración centralizada de variables de entorno
 * 
 * Todas las variables de entorno deben accederse a través de este archivo
 * para facilitar el mantenimiento y evitar errores de tipeo.
 */

export const config = {
  // API REST
  apiUrl: import.meta.env.VITE_API_URL || "https://sir.gavacyc.com/api/",
  
  // WebSocket - Solo la URL base, sin /socket ni /socket.io
  wsUrl: import.meta.env.VITE_WS_URL || "https://sir.gavacyc.com",
  
  // Ambiente
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

// Tipos para autocompletado
export type Config = typeof config;
