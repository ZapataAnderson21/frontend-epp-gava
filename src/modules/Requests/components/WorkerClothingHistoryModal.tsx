import { Download, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { ErrorMessage } from "../../../common/error";
import { LoadingSkeletonTable } from "../../../common/loading";
import { ActionButton } from "../../../components";
import { workClothingApi } from "../../../data/apiUrl";
import type { WorkClothingDelivery, Worker } from "../../../data/types";
import getAuthHeaders from "../../../hooks/getAuthHeaders";
import usePaginatedFetch from "../../../hooks/usePaginatedFetch";
import { useAccess } from "../../../permissions/AccessProvider";

interface Props {
  worker: Worker | null;
  onClose: () => void;
}

export default function WorkerClothingHistoryModal({ worker, onClose }: Props) {
  if (!worker) return null;
  return <HistoryDialog worker={worker} onClose={onClose} />;
}

function HistoryDialog({
  worker,
  onClose,
}: {
  worker: Worker;
  onClose: () => void;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const { can } = useAccess();
  const { items, loading, error } = usePaginatedFetch<WorkClothingDelivery>(
    `${workClothingApi}deliveries/worker/${worker.workerId}`,
    { initialPageSize: 50 },
  );

  useEffect(() => {
    closeButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const download = async (delivery: WorkClothingDelivery) => {
    const response = await fetch(
      `${workClothingApi}deliveries/${delivery.workClothingDeliveryId}/pdf`,
      { headers: getAuthHeaders(), credentials: "include" },
    );
    if (!response.ok) throw new Error("No se pudo descargar la constancia.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `entrega-ropa-${delivery.workClothingDeliveryId}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="worker-history-title"
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h2
              id="worker-history-title"
              className="text-lg font-bold text-gray-900"
            >
              Historial de Ropa de Trabajo
            </h2>
            <p className="text-sm text-gray-600">{worker.fullName}</p>
            {can("workers.view") ? (
              <p className="text-xs text-gray-500">DNI: {worker.dni || "—"}</p>
            ) : null}
          </div>
          <button
            ref={closeButton}
            type="button"
            aria-label="Cerrar historial"
            onClick={onClose}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0047a3]"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="mt-4">
          {loading ? <LoadingSkeletonTable /> : null}
          {error ? <ErrorMessage errorMessage={error} /> : null}
          {!loading && !error && !items.length ? (
            <p className="rounded-md border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No existen entregas reales registradas para este trabajador.
            </p>
          ) : null}
          {items.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Entrega</th>
                    <th className="px-3 py-2">Proyecto</th>
                    <th className="px-3 py-2">Prendas</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((delivery) => (
                    <tr
                      key={delivery.workClothingDeliveryId}
                      className="border-t border-gray-100 align-top"
                    >
                      <td className="px-3 py-2">
                        {new Date(delivery.deliveredAt).toLocaleDateString(
                          "es-PE",
                        )}
                      </td>
                      <td className="px-3 py-2">
                        ER-
                        {String(delivery.workClothingDeliveryId).padStart(
                          6,
                          "0",
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {delivery.project?.name || "—"}
                      </td>
                      <td className="px-3 py-2">
                        {delivery.items
                          .map(
                            (item) =>
                              `${item.elementNameSnapshot} / ${item.variantLabelSnapshot} (${item.quantity})`,
                          )
                          .join(", ")}
                      </td>
                      <td className="px-3 py-2">
                        {delivery.status === "registered"
                          ? "Registrada"
                          : "Anulada"}
                      </td>
                      <td className="px-3 py-2">
                        {can("workClothing.export") ? (
                          <ActionButton
                            icon={<Download />}
                            label="Descargar constancia"
                            onClick={() => void download(delivery)}
                            variant="ghost"
                          />
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
