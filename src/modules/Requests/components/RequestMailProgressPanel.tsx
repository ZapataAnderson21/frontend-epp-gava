import { FaCheckCircle, FaRegCircle, FaSpinner, FaTimesCircle } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import type { RequestMailProgressEvent } from "../../../hooks/useNotification";

interface RequestMailProgressPanelProps {
  open: boolean;
  events: RequestMailProgressEvent[];
  onClose: () => void;
}

function getStatusIcon(status: RequestMailProgressEvent["status"]) {
  if (status === "success") {
    return <FaCheckCircle className="text-emerald-600" />;
  }

  if (status === "error") {
    return <FaTimesCircle className="text-red-600" />;
  }

  if (status === "running") {
    return <FaSpinner className="animate-spin text-blue-600" />;
  }

  return <FaRegCircle className="text-gray-400" />;
}

function getStatusLabel(status: RequestMailProgressEvent["status"]) {
  if (status === "success") return "Listo";
  if (status === "error") return "Error";
  return "En curso";
}

export default function RequestMailProgressPanel({
  open,
  events,
  onClose,
}: RequestMailProgressPanelProps) {
  if (!open || events.length === 0) return null;

  const hasError = events.some((event) => event.status === "error");
  const isDone = events.some((event) => event.step === "done" && event.status === "success");

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[min(92vw,28rem)] rounded-lg border border-gray-200 bg-white shadow-xl">
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            {hasError ? "No se pudo enviar" : isDone ? "Solicitud enviada" : "Enviando solicitud"}
          </h3>
          <p className="text-sm text-gray-500">
            Validacion de correo, PDF y envio en progreso.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Cerrar progreso"
        >
          <IoClose className="size-5" />
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto p-4">
        <ul className="flex flex-col gap-3">
          {events.map((event, index) => (
            <li
              key={`${event.step}-${event.timestamp}-${index}`}
              className="grid grid-cols-[1.25rem_1fr_auto] items-start gap-3"
            >
              <span className="mt-0.5">{getStatusIcon(event.status)}</span>
              <span className="text-sm text-gray-800">{event.message}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                {getStatusLabel(event.status)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
