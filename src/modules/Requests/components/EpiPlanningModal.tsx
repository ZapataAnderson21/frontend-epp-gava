import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft as TiArrowBack,
  CircleX as IoIosCloseCircle,
  Plus as FaPlus,
  Save as FaSave,
} from "lucide-react";


import type {
  ElementRequestType,
  ElementRequestWorkerPlan,
  RequestWorker,
  Worker,
} from "../../../data/types";
import { workerApi } from "../../../data/apiUrl";
import { LoadingSkeletonTable } from "../../../common/loading";
import { ButtonContainer } from "../../../common/form";
import Button from "../../../components/Button";
import { useFetch } from "../../../hooks";
import { formatInventoryQuantity } from "../../Elements/inventoryCatalog";

interface EpiPlanningModalProps {
  open: boolean;
  elementRequest: ElementRequestType | null;
  requestWorkers: RequestWorker[];
  plans: ElementRequestWorkerPlan[];
  onClose: () => void;
  onSave: (plans: ElementRequestWorkerPlan[]) => void;
}

type WorkerFilterKey = "all" | "Obrero" | "Técnico" | "Ingeniero";

const workerFilters: Array<{
  key: WorkerFilterKey;
  label: string;
  workerType?: string;
}> = [
    { key: "all", label: "Todos" },
    { key: "Obrero", label: "Obreros", workerType: "Obrero" },
    { key: "Técnico", label: "Técnicos", workerType: "Técnico" },
    { key: "Ingeniero", label: "Ingenieros", workerType: "Ingeniero" },
  ];

function getWorkerTypeLabel(workerType?: string) {
  if (workerType === "Obrero") return "Obrero";
  if (workerType === "Técnico") return "Técnico";
  if (workerType === "Ingeniero") return "Ingeniero";
  return "Sin tipo";
}

export default function EpiPlanningModal({
  open,
  elementRequest,
  requestWorkers,
  plans,
  onClose,
  onSave,
}: EpiPlanningModalProps) {
  const [draftPlans, setDraftPlans] = useState<ElementRequestWorkerPlan[]>([]);
  const [activeWorkerFilter, setActiveWorkerFilter] = useState<WorkerFilterKey>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");

  const {
    data: workers,
    loading,
    error,
  } = useFetch<Worker[]>(open ? workerApi : "", [open]);

  useEffect(() => {
    if (!open) return;

    const mappedPlans = plans.map((plan) => {
      const existingRequestWorker = requestWorkers.find(
        (requestWorker) =>
          requestWorker.requestWorkerId === plan.requestWorkerId ||
          requestWorker.workerId === plan.requestWorker?.workerId,
      );

      return {
        ...plan,
        elementRequestId: elementRequest?.elementRequestId ?? plan.elementRequestId ?? 0,
        requestWorkerId:
          plan.requestWorkerId ||
          existingRequestWorker?.requestWorkerId ||
          plan.requestWorker?.workerId ||
          0,
        requestWorker: plan.requestWorker ?? existingRequestWorker,
      };
    });

    setDraftPlans(mappedPlans);
    setActiveWorkerFilter("all");
    setSearchTerm("");
    setSelectedWorkerId("");
  }, [open, elementRequest, plans, requestWorkers]);

  const plannedTotal = useMemo(
    () =>
      draftPlans.reduce(
        (total, plan) => total + Number(plan.plannedQuantity || 0),
        0,
      ),
    [draftPlans],
  );

  const requestedTotal = Number(elementRequest?.quantityRequested || 0);
  const remainingTotal = requestedTotal - plannedTotal;

  const selectedWorkerIds = useMemo(
    () =>
      new Set(
        draftPlans
          .map((plan) => plan.requestWorker?.workerId)
          .filter((workerId): workerId is number => Boolean(workerId)),
      ),
    [draftPlans],
  );

  const availableWorkers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (workers || []).filter((worker) => {
      const matchesType =
        activeWorkerFilter === "all" ||
        worker.workerType === workerFilters.find((item) => item.key === activeWorkerFilter)?.workerType;
      const matchesSearch =
        !normalizedSearch ||
        worker.fullName.toLowerCase().includes(normalizedSearch) ||
        worker.dni?.toLowerCase().includes(normalizedSearch);
      const alreadySelected = selectedWorkerIds.has(worker.workerId);

      return matchesType && matchesSearch && !alreadySelected && !worker.deletedAt;
    });
  }, [activeWorkerFilter, searchTerm, selectedWorkerIds, workers]);

  const selectedCounts = useMemo(() => {
    return draftPlans.reduce<Record<string, number>>((acc, plan) => {
      const workerType = plan.requestWorker?.worker?.workerType || "all";
      acc[workerType] = (acc[workerType] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    }, { all: 0 });
  }, [draftPlans]);

  const handleAddWorker = () => {
    const workerId = Number(selectedWorkerId || 0);
    if (!workerId) return;

    const worker = (workers || []).find((item) => item.workerId === workerId);
    if (!worker) return;

    const existingRequestWorker = requestWorkers.find(
      (requestWorker) => requestWorker.workerId === workerId,
    );

    setDraftPlans((current) => [
      ...current,
      {
        elementRequestId: elementRequest?.elementRequestId ?? 0,
        requestWorkerId:
          existingRequestWorker?.requestWorkerId || worker.workerId,
        plannedQuantity: 0,
        size: "",
        notes: "",
        requestWorker:
          existingRequestWorker || {
            requestWorkerId: 0,
            requestId: 0,
            workerId: worker.workerId,
            shirtSize: null,
            pantsSize: null,
            shoeSize: null,
            worker,
          },
      },
    ]);
    setSelectedWorkerId("");
  };

  if (!open || !elementRequest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Detalles de {elementRequest.element?.name}
            </h2>
            <p className="text-xs text-gray-500">
              Aqui defines la planificacion previa de reparto para este EPI. La entrega real al trabajador se registrara despues de forma manual.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Solicitado</p>
              <p className="text-2xl font-extrabold text-gray-800">
                {formatInventoryQuantity(requestedTotal)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Planificado</p>
              <p className="text-2xl font-extrabold text-[#0047a3]">
                {formatInventoryQuantity(plannedTotal)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Pendiente por planificar</p>
              <p className={`text-2xl font-extrabold ${remainingTotal < 0 ? "text-[#b91c1c]" : "text-[#166534]"}`}>
                {formatInventoryQuantity(remainingTotal)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {workerFilters.map((filter) => {
              const countKey = filter.workerType || "all";
              const count = selectedCounts[countKey] || 0;
              const active = activeWorkerFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveWorkerFilter(filter.key)}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${active
                    ? "border-[#0047a3] bg-[#eff6ff] text-[#0047a3]"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <p className="text-2xs font-semibold uppercase tracking-wide text-gray-500">
                    {filter.label}
                  </p>
                  <p className="text-xl font-extrabold">{count}</p>
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(260px,320px)_auto]">
            <input
              type="text"
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
              placeholder="Buscar trabajador por nombre o DNI"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <select
              value={selectedWorkerId}
              onChange={(event) => setSelectedWorkerId(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
            >
              <option value="">Seleccionar trabajador</option>
              {availableWorkers.map((worker) => (
                <option key={worker.workerId} value={worker.workerId}>
                  {worker.fullName} - {getWorkerTypeLabel(worker.workerType)}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[#0047a3] px-4 py-2 font-semibold text-[#0047a3] hover:bg-[#eff6ff]"
              onClick={handleAddWorker}
              disabled={!selectedWorkerId}
            >
              <FaPlus />
              Agregar trabajador
            </button>
          </div>

          {loading ? (
            <LoadingSkeletonTable />
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              {error}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-[minmax(220px,2fr)_120px_120px_minmax(200px,2fr)_40px] gap-3 px-1 text-2xs font-bold uppercase tracking-wide text-gray-500">
                <span>Trabajador</span>
                <span>Cantidad</span>
                <span>Talla</span>
                <span>Detalle</span>
                <span />
              </div>

              {draftPlans.length ? (
                draftPlans.map((plan) => (
                  <div
                    key={plan.requestWorker?.workerId || plan.requestWorkerId}
                    className="grid grid-cols-[minmax(220px,2fr)_120px_120px_minmax(200px,2fr)_40px] gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">
                        {plan.requestWorker?.worker?.fullName || "Sin trabajador"}
                      </span>
                      <span className="text-2xs uppercase text-gray-500">
                        {getWorkerTypeLabel(plan.requestWorker?.worker?.workerType)}
                      </span>
                    </div>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
                      value={plan.plannedQuantity}
                      onChange={(event) =>
                        setDraftPlans((current) =>
                          current.map((item) =>
                            item.requestWorker?.workerId === plan.requestWorker?.workerId
                              ? {
                                ...item,
                                plannedQuantity: Number(event.target.value || 0),
                              }
                              : item,
                          ),
                        )
                      }
                    />

                    <input
                      type="text"
                      className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
                      value={plan.size || ""}
                      placeholder="Talla"
                      onChange={(event) =>
                        setDraftPlans((current) =>
                          current.map((item) =>
                            item.requestWorker?.workerId === plan.requestWorker?.workerId
                              ? {
                                ...item,
                                size: event.target.value,
                              }
                              : item,
                          ),
                        )
                      }
                    />

                    <input
                      type="text"
                      className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
                      value={plan.notes || ""}
                      placeholder="Detalle u observacion"
                      onChange={(event) =>
                        setDraftPlans((current) =>
                          current.map((item) =>
                            item.requestWorker?.workerId === plan.requestWorker?.workerId
                              ? {
                                ...item,
                                notes: event.target.value,
                              }
                              : item,
                          ),
                        )
                      }
                    />

                    <button
                      type="button"
                      className="inline-flex items-center justify-center text-red-500 hover:scale-110"
                      onClick={() =>
                        setDraftPlans((current) =>
                          current.filter(
                            (item) =>
                              item.requestWorker?.workerId !== plan.requestWorker?.workerId,
                          ),
                        )
                      }
                    >
                      <IoIosCloseCircle className="size-6" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-xs text-gray-500">
                  Aun no hay trabajadores agregados para este detalle EPI.
                </div>
              )}
            </div>
          )}

          <ButtonContainer>
            <Button
              type="button"
              label="Cerrar"
              onClick={onClose}
              bgColor="red"
              bgHoverColor="darkred"
              icon={<TiArrowBack />}
            />
            <Button
              type="button"
              label="Guardar detalles"
              onClick={() =>
                onSave(
                  draftPlans.filter(
                    (plan) =>
                      Number(plan.plannedQuantity || 0) > 0 &&
                      Boolean(plan.requestWorker?.workerId),
                  ),
                )
              }
              bgColor="#0047a3"
              bgHoverColor="#003366"
              icon={<FaSave />}
            />
          </ButtonContainer>
        </div>
      </div>
    </div>
  );
}
