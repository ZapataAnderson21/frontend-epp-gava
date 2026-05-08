import { useMemo, useState } from "react";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Panel } from "../../common/panel";
import { inventoryApi } from "../../data/apiUrl";
import type {
  InventoryDashboardDeliveredItem,
  InventoryDashboardResponse,
  InventoryMovement,
} from "../../data/types";
import { useFetch } from "../../hooks";
import { formatInventoryQuantity } from "../Elements/inventoryCatalog";

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function formatMovementDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value || "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year}, ${hours}:${minutes}`;
}

function translateMovementType(type: string) {
  const labels: Record<string, string> = {
    office_entry: "Ingreso a oficina",
    request_received: "Ingreso a obra",
    returned_to_office: "Retorno a oficina",
    transfer_between_projects: "Transferencia",
    assigned_to_worker: "Asignacion a trabajador",
    returned_from_worker: "Retorno de trabajador",
    disposal: "Salida",
    adjustment: "Ajuste",
    maintenance_out: "Salida a mantenimiento",
    maintenance_return: "Retorno de mantenimiento",
  };

  return labels[type] ?? type.split("_").join(" ");
}

function translateInventoryLocation(location: string) {
  const labels: Record<string, string> = {
    office: "Oficina",
    project: "Proyecto",
    worker: "Trabajador",
    external: "Externo",
  };

  return labels[location] ?? location;
}

function getMovementTone(type: string) {
  const tones: Record<string, string> = {
    office_entry: "bg-emerald-600",
    request_received: "bg-blue-600",
    returned_to_office: "bg-blue-600",
    returned_from_worker: "bg-blue-600",
    transfer_between_projects: "bg-indigo-600",
    assigned_to_worker: "bg-indigo-600",
    disposal: "bg-red-600",
    adjustment: "bg-amber-500",
    maintenance_out: "bg-red-600",
    maintenance_return: "bg-emerald-600",
  };

  return tones[type] ?? "bg-gray-700";
}

function getMovementRelatedLabel(movement: InventoryMovement) {
  if (movement.movementType === "assigned_to_worker") {
    return movement.workerName
      ? `Asignado a: ${movement.workerName}`
      : "Asignado a trabajador";
  }

  if (movement.movementType === "returned_from_worker") {
    return movement.workerName
      ? `Retorna: ${movement.workerName}`
      : "Retorno de trabajador";
  }

  if (movement.projectName) return `Proyecto: ${movement.projectName}`;
  if (movement.responsibleUserName) return `Responsable: ${movement.responsibleUserName}`;
  if (movement.performedByUserName) return `Registrado por: ${movement.performedByUserName}`;

  return "-";
}

export default function Dashboard() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const { data, loading, error } = useFetch<InventoryDashboardResponse>(
    `${inventoryApi}dashboard?month=${month}&year=${year}`,
    [month, year],
  );

  const mostDelivered = data?.mostDelivered ?? [];
  const selectedDefault = mostDelivered[0] ?? null;
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);
  const selectedElement =
    mostDelivered.find((item) => item.elementId === selectedElementId) ??
    selectedDefault;

  const maxDelivered = useMemo(
    () =>
      Math.max(
        1,
        ...mostDelivered.map((item) => Number(item.deliveredQuantity || 0)),
      ),
    [mostDelivered],
  );

  const years = Array.from({ length: 5 }, (_, index) => today.getFullYear() - index);

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <Panel>
      <div className="flex w-full flex-col gap-7 p-2 text-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <div className="mt-4 flex gap-6 border-b border-gray-300">
              <button
                type="button"
                className="border-b-4 border-gray-900 px-1 pb-2 text-lg font-bold"
              >
                Elementos de Proteccion
              </button>
              <button
                type="button"
                className="px-1 pb-2 text-lg font-bold text-gray-400"
              >
                Ordenes de Compra
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold focus:outline-[#0047a3]"
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
            >
              {months.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold focus:outline-[#0047a3]"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            >
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-extrabold">Elemento de Proteccion Personal</h2>
            <div className="min-h-[360px] rounded-md border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-5 text-center text-lg font-bold uppercase text-gray-500">
                Cantidad de EP pedidos - {months[month - 1]}
              </h3>
              {mostDelivered.length ? (
                <div className="flex h-72 items-end gap-4 overflow-x-auto border-b border-l border-gray-200 px-4 pb-8">
                  {mostDelivered.map((item: InventoryDashboardDeliveredItem) => {
                    const height = Math.max(
                      10,
                      (Number(item.deliveredQuantity) / maxDelivered) * 240,
                    );
                    const isActive = item.elementId === selectedElement?.elementId;

                    return (
                      <button
                        key={item.elementId}
                        type="button"
                        className="group flex min-w-20 flex-col items-center justify-end gap-2"
                        onClick={() => setSelectedElementId(item.elementId)}
                      >
                        <span className="text-xs font-bold text-gray-500">
                          {formatInventoryQuantity(item.deliveredQuantity)}
                        </span>
                        <span
                          className={`w-9 rounded-t transition-all ${
                            isActive ? "bg-[#0047a3]" : "bg-[#146c8d] group-hover:bg-[#0047a3]"
                          }`}
                          style={{ height }}
                        />
                        <span className="line-clamp-2 min-h-9 text-center text-xs font-semibold text-gray-600">
                          {item.elementName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-gray-300 text-gray-500">
                  No hay entregas registradas en este periodo.
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <h2 className="text-2xl font-extrabold">
              {selectedElement?.elementName ?? "Detalle del EP"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Tipo de elemento" value={selectedElement?.familyLabel ?? "-"} />
              <Metric
                label="Entregados este mes"
                value={selectedElement ? formatInventoryQuantity(selectedElement.deliveredQuantity) : "0"}
              />
              <Metric label="Periodo" value={`${months[month - 1]} ${year}`} />
              <Metric label="Familia" value={selectedElement?.family ?? "-"} />
            </div>

            <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-lg font-extrabold">Stock minimo cercano</h3>
              <div className="flex flex-col gap-2">
                {(data?.minimumStock ?? []).map((item) => (
                  <div
                    key={item.elementId}
                    className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-gray-100 p-3"
                  >
                    <div>
                      <p className="font-bold">{item.elementName}</p>
                      <p className="text-xs font-semibold text-gray-500">
                        {item.familyLabel} · minimo {formatInventoryQuantity(item.stockMinimum)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold">
                        {formatInventoryQuantity(item.officeStock)}
                      </p>
                      <p
                        className={`text-xs font-bold ${
                          item.distanceToMinimum <= 0 ? "text-red-600" : "text-amber-600"
                        }`}
                      >
                        {item.distanceToMinimum <= 0 ? "Bajo minimo" : "Cerca"}
                      </p>
                    </div>
                  </div>
                ))}
                {!data?.minimumStock?.length ? (
                  <p className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                    Aun no hay stock minimo configurado.
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold">Ultimos Movimientos</h2>
          <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Elemento</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Tipo mov.</th>
                  <th className="px-4 py-3">Destino</th>
                  <th className="px-4 py-3">Relacionado</th>
                  <th className="px-4 py-3">Descripcion</th>
                </tr>
              </thead>
              <tbody>
                {(data?.latestMovements ?? []).map((movement: InventoryMovement) => (
                  <tr key={movement.inventoryMovementId} className="border-t border-gray-100">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {formatMovementDate(movement.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">
                        {movement.elementName || "Elemento"}
                      </p>
                      {movement.elementCode ? (
                        <p className="text-xs font-semibold text-gray-500">
                          {movement.elementCode}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{formatInventoryQuantity(movement.quantity)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-3 py-1.5 text-xs font-extrabold text-white ${getMovementTone(
                          movement.movementType,
                        )}`}
                      >
                        {translateMovementType(movement.movementType)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {translateInventoryLocation(movement.toLocation)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {getMovementRelatedLabel(movement)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {movement.notes || "-"}
                    </td>
                  </tr>
                ))}
                {!data?.latestMovements?.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Todavia no hay movimientos registrados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Panel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase text-gray-500">{label}</p>
      <p className="mt-2 break-words text-2xl font-extrabold">{value}</p>
    </div>
  );
}
