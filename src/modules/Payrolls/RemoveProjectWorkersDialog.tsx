import { AlertTriangle, X } from "lucide-react";
import type { GeneralPayrollWorker } from "./types";

interface Props {
  workers: GeneralPayrollWorker[];
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RemoveProjectWorkersDialog({
  workers,
  saving,
  onClose,
  onConfirm,
}: Props) {
  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle className="size-6" />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar confirmación"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="size-5" />
          </button>
        </div>

        <h3 className="mt-4 text-xl font-bold text-[#0f2545]">
          ¿Quitar trabajadores con registros?
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Se borrarán sus asistencias y montos de esta ubicación durante la
          semana. Ya no serán considerados en los totales.
        </p>
        <ul className="mt-3 max-h-40 list-disc overflow-y-auto pl-5 text-sm font-semibold text-gray-700">
          {workers.map((worker) => (
            <li key={worker.generalPayrollWorkerId}>
              {worker.worker.fullName}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 disabled:opacity-60"
          >
            Volver
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? "Quitando..." : "Sí, quitar y borrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
