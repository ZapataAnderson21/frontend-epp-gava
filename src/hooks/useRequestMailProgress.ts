import { useCallback, useEffect, useRef, useState } from "react";
import type { RequestMailProgressEvent } from "./useNotification";

function createOperationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `request-mail-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useRequestMailProgress() {
  const [events, setEvents] = useState<RequestMailProgressEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const operationIdRef = useRef<string | null>(null);

  const start = useCallback((initialMessage = "Preparando envio...") => {
    const operationId = createOperationId();
    operationIdRef.current = operationId;
    setIsOpen(true);
    setEvents([
      {
        operationId,
        step: "save-request",
        status: "running",
        message: initialMessage,
        timestamp: new Date().toISOString(),
      },
    ]);

    return operationId;
  }, []);

  const addLocalEvent = useCallback(
    (
      step: string,
      status: RequestMailProgressEvent["status"],
      message: string,
    ) => {
      const operationId = operationIdRef.current;
      if (!operationId) return;

      setIsOpen(true);
      setEvents((current) => [
        ...current,
        {
          operationId,
          step,
          status,
          message,
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    [],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setEvents([]);
    operationIdRef.current = null;
  }, []);

  useEffect(() => {
    const handleProgress = (event: Event) => {
      const progress = (event as CustomEvent<RequestMailProgressEvent>).detail;
      if (!progress) return;
      if (operationIdRef.current && progress.operationId !== operationIdRef.current) {
        return;
      }

      operationIdRef.current = progress.operationId;
      setIsOpen(true);
      setEvents((current) => [...current, progress]);
    };

    window.addEventListener("requestMailProgress", handleProgress);
    return () => window.removeEventListener("requestMailProgress", handleProgress);
  }, []);

  return {
    events,
    isOpen,
    start,
    addLocalEvent,
    close,
  };
}
