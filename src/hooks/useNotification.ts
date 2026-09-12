// hooks/useNotifications.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Tipos de notificación del backend
export interface Notification {
  notificationId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: number;
  url?: string;
  projectId?: number;
  taskId?: number;
  requestId?: number;
  emergencyId?: number;
  purchaseOrderId?: number;
  project?: { projectId: number; name: string; code: string };
  task?: { taskId: number; title: string };
  request?: { requestId: number; description: string };
  emergency?: { emergencyId: number; title: string };
  purchaseOrder?: { purchaseOrderId: number; code: string };
}

export interface RequestMailProgressEvent {
  operationId: string;
  requestId?: number;
  step: string;
  status: 'running' | 'success' | 'error';
  message: string;
  timestamp: string;
  data?: unknown;
}

interface UseNotificationsOptions {
  apiUrl: string;
  wsUrl: string;
}

export function useNotifications({ apiUrl, wsUrl }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const notificationsBaseUrl = `${apiUrl}notification`;

  // Conectar WebSocket
  useEffect(() => {
    const socket = io(`${wsUrl}/notifications`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('error', (error) => {
      console.error('❌ Error del servidor:', error);
    });

    socket.on('connect', () => {
      console.log('🔔 Conectado a notificaciones');
      setIsConnected(true);
    });

    socket.on('connected', (data) => {
      console.log('✅ Conexión confirmada:', data);
    });

    socket.on('disconnect', () => {
      console.log('🔕 Desconectado de notificaciones');
      setIsConnected(false);
    });

    // Escuchar nuevas notificaciones
    socket.on('notification', (notification: Notification) => {
      console.log('📬 Nueva notificación:', notification);
      setNotifications((prev) => [notification, ...prev]);
    });

    socket.on('requestMailProgress', (progress: RequestMailProgressEvent) => {
      window.dispatchEvent(
        new CustomEvent<RequestMailProgressEvent>('requestMailProgress', {
          detail: progress,
        }),
      );
    });

    // Escuchar actualización del contador
    socket.on('unreadCount', ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    socket.on('connect_error', (error) => {
      console.error('Error de conexión WebSocket:', error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [wsUrl]);

  // Cargar notificaciones iniciales via REST API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(notificationsBaseUrl, {
          credentials: 'include',
        });
        const result = await response.json();
        if (result.data) {
          setNotifications(result.data);
        }
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`${notificationsBaseUrl}/unread-count`, {
          credentials: 'include',
        });
        const result = await response.json();
        if (result.data) {
          setUnreadCount(result.data.unreadCount);
        }
      } catch (error) {
        console.error('Error cargando contador:', error);
      }
    };

    fetchNotifications();
    fetchUnreadCount();
  }, [notificationsBaseUrl]);

  // Marcar como leída
  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        await fetch(`${notificationsBaseUrl}/${notificationId}/read`, {
          method: 'POST',
          credentials: 'include',
        });

        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marcando como leída:', error);
      }
    },
    [notificationsBaseUrl]
  );

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch(`${notificationsBaseUrl}/read-all`, {
        method: 'POST',
        credentials: 'include',
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  }, [notificationsBaseUrl]);

  // Eliminar notificación
  const deleteNotification = useCallback(
    async (notificationId: number) => {
      try {
        await fetch(`${notificationsBaseUrl}/${notificationId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        setNotifications((prev) => {
          const removedNotification = prev.find(
            (n) => n.notificationId === notificationId,
          );

          if (removedNotification && !removedNotification.isRead) {
            setUnreadCount((current) => Math.max(0, current - 1));
          }

          return prev.filter((n) => n.notificationId !== notificationId);
        });
      } catch (error) {
        console.error('Error eliminando notificación:', error);
      }
    },
    [notificationsBaseUrl]
  );

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
