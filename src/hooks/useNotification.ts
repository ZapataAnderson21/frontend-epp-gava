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

interface UseNotificationsOptions {
  apiUrl: string;
  wsUrl: string;
  token: string;
}

export function useNotifications({ apiUrl, wsUrl, token }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  // Conectar WebSocket
  useEffect(() => {
    if (!token) return;

    const socket = io(`${wsUrl}/notifications`, {
      auth: { token },
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
  }, [wsUrl, token]);

  // Cargar notificaciones iniciales via REST API
  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${apiUrl}notification`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
        const response = await fetch(`${apiUrl}notification/unread-count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
  }, [apiUrl, token]);

  // Marcar como leída
  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        await fetch(`${apiUrl}/notification/${notificationId}/read`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
    [apiUrl, token]
  );

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch(`${apiUrl}/notification/read-all`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  }, [apiUrl, token]);

  // Eliminar notificación
  const deleteNotification = useCallback(
    async (notificationId: number) => {
      try {
        await fetch(`${apiUrl}/notification/${notificationId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setNotifications((prev) =>
          prev.filter((n) => n.notificationId !== notificationId)
        );
      } catch (error) {
        console.error('Error eliminando notificación:', error);
      }
    },
    [apiUrl, token]
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