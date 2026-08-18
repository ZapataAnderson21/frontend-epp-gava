import { type ReactNode, useMemo, useState } from "react";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Panel } from "../../common/panel";
import { inventoryApi, workerApi } from "../../data/apiUrl";
import type {
  InventoryDashboardDeliveredItem,
  InventoryDashboardResponse,
  InventoryMovement,
  Worker,
} from "../../data/types";
import { useFetch } from "../../hooks";
import { formatInventoryQuantity } from "../Elements/inventoryCatalog";
import DocumentExpirationDashboard from "./DocumentExpirationDashboard";

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

type DashboardTab = "protection" | "orders" | "birthdays" | "expirations";

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
    assigned_to_worker: "Asignación a trabajador",
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
  const [activeTab, setActiveTab] = useState<DashboardTab>("protection");

  const { data, loading, error } = useFetch<InventoryDashboardResponse>(
    `${inventoryApi}dashboard?month=${month}&year=${year}`,
    [month, year],
  );
  const {
    data: workers,
    loading: workersLoading,
    error: workersError,
  } = useFetch<Worker[]>(`${workerApi}`, []);

  const mostDelivered = useMemo(() => data?.mostDelivered ?? [], [data?.mostDelivered]);
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
  const birthdayWorkers = useMemo(
    () => getBirthdayWorkers(workers ?? [], month, year),
    [workers, month, year],
  );

  if ((activeTab === "protection" && loading) || (activeTab === "birthdays" && workersLoading)) {
    return <LoadingSkeletonTable />;
  }

  if (activeTab === "protection" && error) return <ErrorMessage errorMessage={error} />;
  if (activeTab === "birthdays" && workersError) {
    return <ErrorMessage errorMessage={workersError} />;
  }

  return (
    <Panel>
      <div className="flex w-full flex-col gap-7 p-2 text-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <div className="mt-4 flex flex-wrap gap-6 border-b border-gray-300">
              <TabButton
                active={activeTab === "protection"}
                onClick={() => setActiveTab("protection")}
              >
                Elementos de Protección
              </TabButton>
              <TabButton
                active={activeTab === "orders"}
                onClick={() => setActiveTab("orders")}
              >
                Órdenes de Compra
              </TabButton>
              <TabButton
                active={activeTab === "birthdays"}
                onClick={() => setActiveTab("birthdays")}
              >
                Cumpleaños
              </TabButton>
              <TabButton
                active={activeTab === "expirations"}
                onClick={() => setActiveTab("expirations")}
              >
                Vencimientos
              </TabButton>
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

        {activeTab === "protection" ? (
          <>
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="flex min-w-0 flex-col gap-4">
                <h2 className="text-2xl font-extrabold">
                  Elemento de Protección Personal
                </h2>
                <div className="min-h-[360px] min-w-0 rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-5 text-center text-lg font-bold uppercase text-gray-500">
                    Cantidad de EP pedidos - {months[month - 1]}
                  </h3>
                  {mostDelivered.length ? (
                    <div
                      className="dashboard-chart-scrollbar w-full max-w-full overflow-x-auto overscroll-x-contain pb-2"
                      tabIndex={0}
                      aria-label="Gráfico desplazable de elementos de protección"
                    >
                      <div className="flex h-72 w-max min-w-full items-end gap-4 border-b border-l border-gray-200 px-4 pb-8">
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
                              className="group flex w-28 flex-none flex-col items-center justify-end gap-2"
                              onClick={() => setSelectedElementId(item.elementId)}
                            >
                              <span className="text-xs font-bold text-gray-500">
                                {formatInventoryQuantity(item.deliveredQuantity)}
                              </span>
                              <span
                                className={`w-9 rounded-t transition-all ${
                                  isActive
                                    ? "bg-[#0047a3]"
                                    : "bg-[#146c8d] group-hover:bg-[#0047a3]"
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
                    value={
                      selectedElement
                        ? formatInventoryQuantity(selectedElement.deliveredQuantity)
                        : "0"
                    }
                  />
                  <Metric label="Periodo" value={`${months[month - 1]} ${year}`} />
                  <Metric label="Familia" value={selectedElement?.family ?? "-"} />
                </div>

                <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-lg font-extrabold">Stock mínimo cercano</h3>
                  <div className="flex flex-col gap-2">
                    {(data?.minimumStock ?? []).map((item) => (
                      <div
                        key={item.elementId}
                        className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-gray-100 p-3"
                      >
                        <div>
                          <p className="font-bold">{item.elementName}</p>
                          <p className="text-xs font-semibold text-gray-500">
                            {item.familyLabel} · mínimo{" "}
                            {formatInventoryQuantity(item.stockMinimum)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-extrabold">
                            {formatInventoryQuantity(item.officeStock)}
                          </p>
                          <p
                            className={`text-xs font-bold ${
                              item.distanceToMinimum <= 0
                                ? "text-red-600"
                                : "text-amber-600"
                            }`}
                          >
                            {item.distanceToMinimum <= 0 ? "Bajo mínimo" : "Cerca"}
                          </p>
                        </div>
                      </div>
                    ))}
                    {!data?.minimumStock?.length ? (
                      <p className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                        Aún no hay stock mínimo configurado.
                      </p>
                    ) : null}
                  </div>
                </div>
              </aside>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-extrabold">Últimos Movimientos</h2>
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
                      <th className="px-4 py-3">Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.latestMovements ?? []).map((movement: InventoryMovement) => (
                      <tr
                        key={movement.inventoryMovementId}
                        className="border-t border-gray-100"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">
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
                        <td className="px-4 py-3">
                          {formatInventoryQuantity(movement.quantity)}
                        </td>
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
                          Todavía no hay movimientos registrados.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}

        {activeTab === "birthdays" ? (
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-extrabold">
                Cumpleaños de {months[month - 1]} {year}
              </h2>
              <p className="text-sm font-semibold text-gray-500">
                {birthdayWorkers.length} trabajador
                {birthdayWorkers.length === 1 ? "" : "es"} cumple
                {birthdayWorkers.length === 1 ? "" : "n"} años este mes.
              </p>
            </div>

            <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Día</th>
                    <th className="px-4 py-3">Trabajador</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Edad que cumple</th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3">Correo</th>
                  </tr>
                </thead>
                <tbody>
                  {birthdayWorkers.map((worker) => (
                    <tr key={worker.workerId} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <span className="inline-flex min-w-12 justify-center rounded-md bg-blue-50 px-3 py-2 text-base font-extrabold text-[#0047a3]">
                          {String(worker.birthdayDay).padStart(2, "0")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {worker.fullName}
                      </td>
                      <td className="px-4 py-3">{normalizeWorkerTypeLabel(worker.workerType)}</td>
                      <td className="px-4 py-3 text-lg font-extrabold">
                        {worker.ageTurning}
                      </td>
                      <td className="px-4 py-3">{worker.phone || "-"}</td>
                      <td className="px-4 py-3">{worker.personalEmail || "-"}</td>
                    </tr>
                  ))}
                  {!birthdayWorkers.length ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                        No hay cumpleaños registrados para este mes.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === "orders" ? (
          <section className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            Aún no hay indicadores configurados para órdenes de compra.
          </section>
        ) : null}

        {activeTab === "expirations" ? (
          <DocumentExpirationDashboard month={month} year={year} />
        ) : null}
      </div>
    </Panel>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-1 pb-2 text-lg font-bold ${
        active ? "border-b-4 border-gray-900" : "text-gray-400"
      }`}
    >
      {children}
    </button>
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

type BirthdayWorker = Worker & {
  birthdayDay: number;
  ageTurning: number;
};

function getBirthdayWorkers(workers: Worker[], month: number, year: number) {
  return workers
    .map((worker) => {
      const birthday = parseBirthDate(worker.birthDate);
      if (!birthday || birthday.month !== month) return null;

      return {
        ...worker,
        birthdayDay: birthday.day,
        ageTurning: Math.max(0, year - birthday.year),
      };
    })
    .filter((worker): worker is BirthdayWorker => Boolean(worker))
    .sort((a, b) => a.birthdayDay - b.birthdayDay || a.fullName.localeCompare(b.fullName));
}

function parseBirthDate(value?: string) {
  if (!value) return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function normalizeWorkerTypeLabel(type?: string) {
  const labels: Record<string, string> = {
    laborer: "Obrero",
    technician: "Técnico",
    engineer: "Ingeniero",
    administrator: "Administrador(a)",
    manager: "Gerente",
    unspecified: "No Especificado",
    Obrero: "Obrero",
    "TÃ©cnico": "Técnico",
    Técnico: "Técnico",
    Ingeniero: "Ingeniero",
    "Administrador(a)": "Administrador(a)",
    Gerente: "Gerente",
  };

  return labels[type ?? ""] ?? type ?? "No Especificado";
}
