import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaChevronLeft, FaChevronRight, FaUserPlus } from "react-icons/fa6";
import { IoCloseCircle } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "../../common/error";
import { inventoryApi, projectApi, workerApi } from "../../data/apiUrl";
import {
  WorkerType,
  type Project,
  type ProjectInventoryEntry,
  type ProjectInventoryResponse,
  type Worker,
  type WorkerInventoryAssignment,
  type WorkerInventoryHistoryResponse,
} from "../../data/types";
import { useApiAction, useCurrentUser, useFetch } from "../../hooks";
import { formatDateTime, ymdLocalMidnightToUtc } from "../../utils";
import {
  formatInventoryQuantity,
  getInventoryFamilyFromSource,
  getInventoryFamilyLabel,
  type InventoryFamilyTabKey,
} from "../Elements/inventoryCatalog";

interface WorkerProps {
  workerId: number;
  closeAction: () => void;
}

const assignableFamilies: InventoryFamilyTabKey[] = ["epp", "epi", "uniform", "harness"];

const monthNames = [
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

const getTodayDateInputValue = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

function getEntryFamily(entry: ProjectInventoryEntry) {
  return getInventoryFamilyFromSource({
    type: entry.elementType,
    controlType: entry.controlType,
    code: entry.elementCode,
    family: entry.fallProtectionGroupId ? "harness" : entry.family,
  });
}

function getEntryAvailableToAssign(entry: ProjectInventoryEntry) {
  return entry.quantityAvailableForAssignment ?? entry.quantityPending;
}

function formatBirthDate(value?: string | null) {
  const datePart = value?.split("T")[0];
  const [year, month, day] = datePart?.split("-") ?? [];
  if (!year || !month || !day) return "No especificada";
  return `${day}/${month}/${year}`;
}

export default function Worker({ workerId, closeAction }: WorkerProps) {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const today = new Date();
  const [familyFilter, setFamilyFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState(0);
  const [yearFilter, setYearFilter] = useState(today.getFullYear());
  const [workerPanelCollapsed, setWorkerPanelCollapsed] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(0);
  const [assignmentFamily, setAssignmentFamily] =
    useState<InventoryFamilyTabKey>("epp");
  const [selectedEntryId, setSelectedEntryId] = useState(0);
  const [assignmentQuantity, setAssignmentQuantity] = useState(1);
  const [assignmentDate, setAssignmentDate] = useState(getTodayDateInputValue());
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [elementSearch, setElementSearch] = useState("");

  const { data: worker, error, loading } = useFetch<Worker>(`${workerApi}${workerId}`);
  const { data: projects } = useFetch<Project[]>(`${projectApi}status/active`);
  const { data: projectInventory, refetch: refetchProjectInventory } =
    useFetch<ProjectInventoryResponse>(
      selectedProjectId ? `${inventoryApi}project/${selectedProjectId}` : "",
      [selectedProjectId],
    );
  const { execute: registerAssignment, loading: assigning } =
    useApiAction<WorkerInventoryAssignment[]>();

  const historyUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (familyFilter) params.set("family", familyFilter);
    if (monthFilter) params.set("month", String(monthFilter));
    if (yearFilter) params.set("year", String(yearFilter));
    return `${inventoryApi}worker/${workerId}/history?${params.toString()}`;
  }, [familyFilter, monthFilter, workerId, yearFilter]);
  const { data: inventoryHistory, refetch: refetchInventoryHistory } =
    useFetch<WorkerInventoryHistoryResponse>(historyUrl, [historyUrl]);

  const assignmentEntries = useMemo(
    () =>
      (projectInventory?.entries ?? [])
        .filter((entry) => {
          const family = getEntryFamily(entry);
          return (
            assignableFamilies.includes(family) &&
            family === assignmentFamily
          );
        })
        .sort((a, b) => {
          const availableA = getEntryAvailableToAssign(a);
          const availableB = getEntryAvailableToAssign(b);
          if (availableA > 0 && availableB <= 0) return -1;
          if (availableA <= 0 && availableB > 0) return 1;
          return a.elementName.localeCompare(b.elementName);
        }),
    [assignmentFamily, projectInventory?.entries],
  );

  const filteredAssignmentEntries = useMemo(() => {
    const normalizedSearch = elementSearch.trim().toLowerCase();
    if (!normalizedSearch) return assignmentEntries;

    return assignmentEntries.filter((entry) =>
      [
        entry.elementName,
        entry.elementCode,
        entry.elementVariantLabel,
        entry.categoryName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [assignmentEntries, elementSearch]);

  const selectedEntry = useMemo(
    () =>
      assignmentEntries.find(
        (entry) => entry.projectInventoryEntryId === selectedEntryId,
      ) ?? null,
    [assignmentEntries, selectedEntryId],
  );
  const selectedEntryAvailable = selectedEntry
    ? getEntryAvailableToAssign(selectedEntry)
    : 0;

  useEffect(() => {
    if (!selectedProjectId && projects?.length) {
      setSelectedProjectId(projects[0].projectId);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    const selectedStillAvailable = assignmentEntries.some(
      (entry) => entry.projectInventoryEntryId === selectedEntryId,
    );

    if (!selectedStillAvailable) {
      const firstAvailable =
        assignmentEntries.find((entry) => getEntryAvailableToAssign(entry) > 0) ??
        assignmentEntries[0];
      const firstAvailableQuantity = firstAvailable
        ? getEntryAvailableToAssign(firstAvailable)
        : 0;
      setSelectedEntryId(firstAvailable?.projectInventoryEntryId ?? 0);
      setAssignmentQuantity(firstAvailableQuantity > 0 ? 1 : 0);
      return;
    }

    if (selectedEntry && assignmentQuantity > selectedEntryAvailable) {
      setAssignmentQuantity(selectedEntryAvailable);
    }
  }, [
    assignmentQuantity,
    assignmentEntries,
    selectedEntry,
    selectedEntryAvailable,
    selectedEntryId,
  ]);

  const getWorkerTypeLabel = (workerType: string | undefined): string => {
    if (!workerType) return "No especificado";

    const typeEntry = Object.values(WorkerType).find(
      (type) => type[0] === workerType.toLowerCase(),
    );

    return typeEntry ? typeEntry[1] : workerType;
  };

  const handleRegisterWorkerAssignment = async () => {
    if (!user) {
      toast.error("No se pudo identificar al usuario actual.");
      return;
    }

    if (!selectedEntry) {
      toast.error("Selecciona un elemento disponible en obra.");
      return;
    }

    if (!assignmentDate) {
      toast.error("Selecciona la fecha de asignacion.");
      return;
    }

    if (assignmentQuantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0.");
      return;
    }

    if (assignmentQuantity > selectedEntryAvailable) {
      toast.error(
        `Solo hay ${formatInventoryQuantity(selectedEntryAvailable)} unidad(es) disponibles para asignar.`,
      );
      return;
    }

    await toast.promise(
      registerAssignment(
        `${inventoryApi}project-entry/${selectedEntry.projectInventoryEntryId}/assign-workers`,
        "POST",
        {
          performedByUserId: user.userId,
          assignments: [
            {
              workerId,
              quantity: assignmentQuantity,
              assignedAt: ymdLocalMidnightToUtc(assignmentDate, "America/Lima"),
              notes: assignmentNotes.trim() || undefined,
            },
          ],
        },
      ),
      {
        loading: "Registrando asignacion...",
        success: () => {
          setAssignmentQuantity(1);
          setAssignmentNotes("");
          refetchInventoryHistory();
          refetchProjectInventory();
          return "Asignacion registrada exitosamente.";
        },
        error: (err) => err.message || "No se pudo registrar la asignacion.",
      },
    );
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <ErrorMessage errorMessage="Error al cargar el trabajador" />;

  return (
    <div className="relative max-h-full w-[min(1100px,95vw)] overflow-auto rounded-xl bg-white p-8 text-gray-900">
      <h1 className="mb-4 text-2xl font-extrabold">
        DETALLE DEL TRABAJADOR {worker?.workerId}
      </h1>

      <div
        className={`grid gap-8 ${
          workerPanelCollapsed
            ? "lg:grid-cols-1"
            : "lg:grid-cols-[minmax(0,1fr)_minmax(420px,1fr)]"
        }`}
      >
        {!workerPanelCollapsed ? (
          <div className="flex w-full flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Informacion Personal</h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => setWorkerPanelCollapsed(true)}
              >
                <FaChevronLeft className="size-3.5" />
                Ocultar
              </button>
            </div>
            <InfoLine label="Nombre completo" value={worker?.fullName} />
            <InfoLine label="DNI" value={worker?.dni} />
            <InfoLine label="Fecha de nacimiento" value={formatBirthDate(worker?.birthDate)} />

            <h2 className="mt-4 text-xl font-bold">Informacion de contacto</h2>
            <InfoLine label="Correo" value={worker?.personalEmail} />
            <InfoLine label="Telefono" value={worker?.phone} />
            <InfoLine label="Direccion" value={worker?.address} />

            <h2 className="mt-4 text-xl font-bold">Informacion laboral</h2>
            <InfoLine
              label="Grupo de trabajador"
              value={getWorkerTypeLabel(worker?.workerType)}
            />
            <InfoLine
              label="Fecha y hora de registro"
              value={formatDateTime(worker?.createdAt)}
            />
            <div className="mt-3">
              <button
                type="button"
                className="rounded-md bg-[#0047a3] px-4 py-2 font-semibold text-white hover:bg-[#003366]"
                onClick={() => {
                  closeAction();
                  navigate(`/admin/worker-monthly-evaluations?workerId=${workerId}`);
                }}
              >
                Ver evaluaciones mensuales
              </button>
            </div>
          </div>
        ) : null}

        <div
          className={`flex flex-col gap-4 border-t border-gray-200 pt-6 ${
            workerPanelCollapsed ? "" : "lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
          }`}
        >
          {workerPanelCollapsed ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div>
                <p className="text-sm font-bold text-gray-500">Trabajador</p>
                <p className="font-extrabold text-gray-900">{worker?.fullName}</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => setWorkerPanelCollapsed(false)}
              >
                <FaChevronRight className="size-3.5" />
                Mostrar datos
              </button>
            </div>
          ) : null}

          <div className="order-2 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <h2 className="text-2xl font-extrabold">Historial de EP y EPA</h2>
            <div className="flex flex-wrap gap-2">
              <select
                className="rounded-md border border-gray-300 px-2 py-1 text-sm font-semibold"
                value={familyFilter}
                onChange={(event) => setFamilyFilter(event.target.value)}
              >
                <option value="">Todos</option>
                <option value="epp">EPP</option>
                <option value="epi">EPI</option>
                <option value="uniform">Uniforme</option>
                <option value="harness">EPA</option>
              </select>
              <select
                className="rounded-md border border-gray-300 px-2 py-1 text-sm font-semibold"
                value={monthFilter}
                onChange={(event) => setMonthFilter(Number(event.target.value))}
              >
                <option value={0}>Todos los meses</option>
                {monthNames.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border border-gray-300 px-2 py-1 text-sm font-semibold"
                value={yearFilter}
                onChange={(event) => setYearFilter(Number(event.target.value))}
              >
                {[0, 1, 2, 3].map((offset) => {
                  const value = today.getFullYear() - offset;
                  return (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="order-2 w-fit rounded-lg border border-gray-200 bg-gray-100 p-4">
            <p className="text-sm font-bold text-gray-600">Cantidad total</p>
            <p className="text-4xl font-extrabold">
              {formatInventoryQuantity(inventoryHistory?.summary.totalQuantity ?? 0)}
            </p>
          </div>

          <div className="order-2 max-h-80 overflow-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-gray-900">
                  <th className="py-2 pr-4">EP/EPA</th>
                  <th className="py-2 pr-4">Cant</th>
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Obra</th>
                </tr>
              </thead>
              <tbody>
                {(inventoryHistory?.assignments ?? []).map((assignment) => (
                  <tr
                    key={assignment.workerInventoryAssignmentId}
                    className="border-t border-gray-100"
                  >
                    <td className="py-3 pr-4 font-semibold">
                      {assignment.elementName}
                    </td>
                    <td className="py-3 pr-4">
                      {formatInventoryQuantity(assignment.quantityAssigned)}
                    </td>
                    <td className="py-3 pr-4">
                      {assignment.assignedAt?.split("T")[0]?.split("-").reverse().join("/")}
                    </td>
                    <td className="py-3 pr-4">{assignment.projectName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!inventoryHistory?.assignments?.length ? (
              <p className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                No hay entregas registradas con estos filtros.
              </p>
            ) : null}
          </div>

          <div className="order-1 rounded-lg border border-gray-200 p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">Asignar EP/EPA</h2>
                <p className="text-sm text-gray-500">
                  Selecciona un proyecto activo y un item disponible en obra.
                </p>
              </div>
              <FaUserPlus className="mt-1 size-5 text-emerald-600" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-semibold">
                Proyecto activo
                <select
                  className="rounded-md border border-gray-300 px-3 py-2 font-normal focus:outline-[#0047a3]"
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(Number(event.target.value))}
                >
                  <option value={0}>Seleccionar...</option>
                  {(projects ?? []).map((project) => (
                    <option key={project.projectId} value={project.projectId}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold">
                Tipo de elemento
                <select
                  className="rounded-md border border-gray-300 px-3 py-2 font-normal focus:outline-[#0047a3]"
                  value={assignmentFamily}
                  onChange={(event) =>
                    setAssignmentFamily(event.target.value as InventoryFamilyTabKey)
                  }
                >
                  {assignableFamilies.map((family) => (
                    <option key={family} value={family}>
                      {getInventoryFamilyLabel(family)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-2 text-sm font-semibold md:col-span-2">
                <label htmlFor="worker-assignment-element-search">
                  Buscar elemento
                </label>
                <input
                  id="worker-assignment-element-search"
                  type="search"
                  className="rounded-md border border-gray-300 px-3 py-2 font-normal focus:outline-[#0047a3]"
                  value={elementSearch}
                  onChange={(event) => setElementSearch(event.target.value)}
                  placeholder="Escribe nombre, codigo, variante o categoria"
                />
                <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200">
                  {filteredAssignmentEntries.length ? (
                    filteredAssignmentEntries.map((entry) => {
                      const available = getEntryAvailableToAssign(entry);
                      const unavailable = available <= 0;
                      const selected =
                        selectedEntryId === entry.projectInventoryEntryId;

                      return (
                        <button
                          key={entry.projectInventoryEntryId}
                          type="button"
                          className={`flex w-full items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left text-sm transition-colors last:border-b-0 ${
                            selected
                              ? "bg-[#0047a3] text-white"
                              : unavailable
                                ? "bg-red-50 text-red-900 hover:bg-red-100"
                                : "bg-white text-gray-900 hover:bg-emerald-50"
                          }`}
                          onClick={() => {
                            setSelectedEntryId(entry.projectInventoryEntryId);
                            setAssignmentQuantity(unavailable ? 0 : 1);
                          }}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-bold">
                              {entry.elementName}
                              {entry.elementVariantLabel
                                ? ` - ${entry.elementVariantLabel}`
                                : ""}
                              {entry.fallProtectionGroupId
                                ? ` - ${entry.elementCode || "EPA"}`
                                : ""}
                            </span>
                            <span
                              className={`block text-xs ${
                                selected
                                  ? "text-white/80"
                                  : unavailable
                                    ? "text-red-700"
                                    : "text-gray-500"
                              }`}
                            >
                              {entry.categoryName || "Sin categoria"}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-xs font-extrabold ${
                              selected
                                ? "bg-white/20 text-white"
                                : unavailable
                                  ? "bg-red-200 text-red-900"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {unavailable
                              ? "Sin stock"
                              : `Disp. ${formatInventoryQuantity(available)}`}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="p-3 text-sm font-normal text-gray-500">
                      No hay elementos que coincidan con la busqueda.
                    </p>
                  )}
                </div>
              </div>

              <label className="flex flex-col gap-1 text-sm font-semibold">
                Fecha
                <input
                  type="date"
                  className="rounded-md border border-gray-300 px-3 py-2 font-normal focus:outline-[#0047a3]"
                  value={assignmentDate}
                  onChange={(event) => setAssignmentDate(event.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold">
                Cantidad
                <input
                  type="number"
                  min={selectedEntry ? 1 : 0}
                  max={selectedEntryAvailable || 0}
                  step={1}
                  className="rounded-md border border-gray-300 px-3 py-2 font-normal focus:outline-[#0047a3]"
                  value={assignmentQuantity}
                  onChange={(event) => setAssignmentQuantity(Number(event.target.value))}
                  disabled={!selectedEntry}
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold md:col-span-2">
                Observacion
                <input
                  type="text"
                  className="rounded-md border border-gray-300 px-3 py-2 font-normal focus:outline-[#0047a3]"
                  value={assignmentNotes}
                  onChange={(event) => setAssignmentNotes(event.target.value)}
                  placeholder="Detalle de entrega"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p
                className={`text-sm font-semibold ${
                  assignmentQuantity > selectedEntryAvailable
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                Disponible en obra: {formatInventoryQuantity(selectedEntryAvailable)}
              </p>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                onClick={handleRegisterWorkerAssignment}
                disabled={assigning || !selectedEntry || selectedEntryAvailable <= 0}
              >
                <FaUserPlus className="size-4" />
                {assigning ? "Guardando..." : "Asignar al trabajador"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-2 top-2">
        <IoCloseCircle className="size-8 cursor-pointer" onClick={closeAction} />
      </div>
    </div>
  );
}

function InfoLine({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex flex-row gap-2">
      <label className="font-semibold text-nowrap">{label}:</label>
      <span>{value || "No especificado"}</span>
    </div>
  );
}
