import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { FaArrowRotateLeft, FaTrash, FaUserPlus, FaXmark } from "react-icons/fa6";
import { Table } from "../../../../../common/table";
import { ErrorMessage } from "../../../../../common/error";
import { LoadingSkeletonTable } from "../../../../../common/loading";
import { useApiAction, useCurrentUser, useFetch } from "../../../../../hooks";
import { inventoryApi, workerApi } from "../../../../../data/apiUrl";
import type {
  ProjectInventoryEntry,
  ProjectInventoryResponse,
  Worker,
  WorkerInventoryAssignment,
} from "../../../../../data/types";
import { SeeButton } from "../../../../../common/button";
import ActionButton from "../../../../../components/ActionButton";
import DeleteConfirmDialog from "../../../../../components/DeleteConfirmDialog";
import { logisticsTypes, riskPreventionTypes } from "../../../../../utils";
import {
  formatInventoryQuantity,
  getInventoryFamilyConfig,
  getInventoryFamilyFromSource,
  getInventoryFamilyLabel,
} from "../../../../Elements/inventoryCatalog";
import { formatDate, ymdLocalMidnightToUtc } from "../../../../../utils";

type ProjectInventoryTab =
  | "protection"
  | "safety"
  | "ssomaSupply"
  | "fallProtection"
  | "officeMaterial";
type AssignmentDraft = {
  localId: number;
  workerId: number;
  quantity: number;
  assignedAt: string;
  notes: string;
};

type ReturnBlockerNavigationState = {
  showReturnBlockers?: boolean;
  blockerIds?: number[];
  blockers?: ProjectInventoryEntry[];
};

type StoredReturnBlockers = ReturnBlockerNavigationState & {
  createdAt?: number;
};

const getTodayDateInputValue = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const projectInventoryTabs: Array<{
  key: ProjectInventoryTab;
  label: string;
  title: string;
}> = [
  {
    key: "protection",
    label: "Elem. Protecc. Personal",
    title: "Elementos de Proteccion Personal",
  },
  {
    key: "safety",
    label: "Eq. Seg. y Emerg.",
    title: "Equipamiento de Seguridad y Emergencia",
  },
  {
    key: "ssomaSupply",
    label: "Insumos SSOMA",
    title: "Insumos SSOMA",
  },
  {
    key: "fallProtection",
    label: "Eq. Protecc. Anticaida",
    title: "Equipo de Proteccion Anticaida - Grupos",
  },
  {
    key: "officeMaterial",
    label: "Materiales de Oficina",
    title: "Materiales de Oficina",
  },
];

const getProjectEntryIds = (entry: ProjectInventoryEntry) =>
  entry.projectInventoryEntryIds?.length
    ? entry.projectInventoryEntryIds
    : [entry.projectInventoryEntryId];

export default function ProjectInventory() {
  const { id: projectId } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useCurrentUser();

  const { data, loading, error, refetch } = useFetch<ProjectInventoryResponse>(
    projectId ? `${inventoryApi}project/${projectId}` : "",
    [projectId],
  );
  const { data: workers } = useFetch<Worker[]>(workerApi, []);

  const { execute: registerReturn, loading: returning } =
    useApiAction<ProjectInventoryEntry>();
  const { execute: registerAssignment, loading: assigning } =
    useApiAction<WorkerInventoryAssignment>();
  const { execute: deleteAssignment, loading: deletingAssignment } =
    useApiAction<WorkerInventoryAssignment>();

  const [selectedEntry, setSelectedEntry] = useState<ProjectInventoryEntry | null>(
    null,
  );
  const [selectedAssignEntry, setSelectedAssignEntry] =
    useState<ProjectInventoryEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnNotes, setReturnNotes] = useState("");
  const [assignmentRows, setAssignmentRows] = useState<AssignmentDraft[]>([
    {
      localId: Date.now(),
      workerId: 0,
      quantity: 1,
      assignedAt: getTodayDateInputValue(),
      notes: "",
    },
  ]);
  const [activeTab, setActiveTab] = useState<ProjectInventoryTab>("protection");
  const [selectedDetailEntry, setSelectedDetailEntry] =
    useState<ProjectInventoryEntry | null>(null);
  const [highlightedReturnIds, setHighlightedReturnIds] = useState<number[]>([]);
  const [returnBlockers, setReturnBlockers] = useState<ProjectInventoryEntry[]>(
    [],
  );
  const [returnBlockerModalOpen, setReturnBlockerModalOpen] = useState(false);
  const [returnBlockerPromptHandled, setReturnBlockerPromptHandled] =
    useState(false);
  const [assignmentToDelete, setAssignmentToDelete] =
    useState<WorkerInventoryAssignment | null>(null);

  const getEntryFamily = (entry: ProjectInventoryEntry) =>
    getInventoryFamilyFromSource({
      type: entry.elementType,
      controlType: entry.controlType,
      code: entry.elementCode,
      family: entry.family,
    });

  const getEntryTab = (entry: ProjectInventoryEntry): ProjectInventoryTab | "other" => {
    const family = getEntryFamily(entry);

    if (["epp", "epi", "uniform"].includes(family)) return "protection";
    if (family === "ese") return "safety";
    if (family === "ssomaSupply") return "ssomaSupply";
    if (family === "harness") return "fallProtection";
    if (family === "officeMaterial") return "officeMaterial";
    return "other";
  };

  useEffect(() => {
    if (!data || !projectId || returnBlockerPromptHandled) return;

    const state = (location.state || null) as ReturnBlockerNavigationState | null;
    const storageKey = `project-return-blockers:${projectId}`;
    const storedRaw = sessionStorage.getItem(storageKey);
    let stored: StoredReturnBlockers | null = null;

    if (storedRaw) {
      try {
        stored = JSON.parse(storedRaw) as StoredReturnBlockers;
      } catch {
        stored = null;
      }
    }

    const shouldShow =
      state?.showReturnBlockers ||
      stored?.showReturnBlockers ||
      Boolean(state?.blockers?.length) ||
      Boolean(stored?.blockers?.length);

    if (!shouldShow) return;

    const blockerIds = [
      ...(state?.blockerIds || []),
      ...(stored?.blockerIds || []),
      ...((state?.blockers || []).flatMap(getProjectEntryIds)),
      ...((stored?.blockers || []).flatMap(getProjectEntryIds)),
    ];
    const uniqueBlockerIds = Array.from(new Set(blockerIds));

    const blockers = uniqueBlockerIds.length
      ? data.entries.filter((entry) =>
          getProjectEntryIds(entry).some((id) => uniqueBlockerIds.includes(id)),
        )
      : data.entries.filter((entry) => entry.blocksProjectInactivation);

    const currentBlockers = blockers.length
      ? blockers
      : data.entries.filter((entry) => entry.blocksProjectInactivation);

    if (currentBlockers.length) {
      const idsToHighlight = currentBlockers.flatMap(getProjectEntryIds);
      setReturnBlockers(currentBlockers);
      setHighlightedReturnIds(idsToHighlight);
      setReturnBlockerModalOpen(true);

      const firstTab = getEntryTab(currentBlockers[0]);
      if (firstTab !== "other") setActiveTab(firstTab);

      const timer = window.setTimeout(() => {
        setHighlightedReturnIds([]);
      }, 10000);

      sessionStorage.removeItem(storageKey);
      setReturnBlockerPromptHandled(true);

      return () => window.clearTimeout(timer);
    }

    sessionStorage.removeItem(storageKey);
    setReturnBlockerPromptHandled(true);
  }, [data, location.state, projectId, returnBlockerPromptHandled]);

  useEffect(() => {
    if (!selectedEntry) {
      setReturnQuantity(1);
      setReturnNotes("");
      return;
    }

    const family = getEntryFamily(selectedEntry);
    const familyConfig = getInventoryFamilyConfig(family);

    const availableToReturn =
      selectedEntry.quantityAvailableForReturn ?? selectedEntry.quantityPending;

    setReturnQuantity(
      availableToReturn > 0
        ? familyConfig?.consumable && selectedEntry.quantityPending < 1
          ? availableToReturn
          : Math.min(availableToReturn, 1)
        : 0,
    );
    setReturnNotes("");
  }, [selectedEntry]);

  useEffect(() => {
    const emptyRow = {
      localId: Date.now(),
      workerId: 0,
      quantity: 1,
      assignedAt: getTodayDateInputValue(),
      notes: "",
    };

    if (!selectedAssignEntry) {
      setAssignmentRows([emptyRow]);
      return;
    }

    setAssignmentRows([emptyRow]);
  }, [selectedAssignEntry]);

  const canManageInventory = Boolean(
    user &&
      (logisticsTypes.includes(user.userType) ||
        riskPreventionTypes.includes(user.userType) ||
        user.userType === "SISTEMAS"),
  );
  const canAssignInventory = Boolean(
    user &&
      (user.userType === "GERENTE" ||
        user.userType === "ADMINISTRADORA" ||
        user.userType === "SISTEMAS" ||
        riskPreventionTypes.includes(user.userType)),
  );

  const handleRegisterReturn = async () => {
    if (!selectedEntry || !user) return;

    if (returnQuantity <= 0) {
      toast.error("La cantidad a retornar debe ser mayor a 0.");
      return;
    }

    const availableToReturn =
      selectedEntry.quantityAvailableForReturn ?? selectedEntry.quantityPending;

    if (returnQuantity > availableToReturn) {
      toast.error("La cantidad supera lo disponible en obra para retornar.");
      return;
    }

    await toast.promise(
      registerReturn(
        `${inventoryApi}project-entry/${selectedEntry.projectInventoryEntryId}/return`,
        "POST",
        {
          quantity: returnQuantity,
          performedByUserId: user.userId,
          notes: returnNotes,
        },
      ),
      {
        loading: "Registrando retorno...",
        success: () => {
          setSelectedEntry(null);
          refetch();
          return "Retorno registrado exitosamente.";
        },
        error: (err) => err.message || "No se pudo registrar el retorno.",
      },
    );
  };

  const handleRegisterAssignment = async () => {
    if (!selectedAssignEntry || !user) return;

    const availableToAssign =
      selectedAssignEntry.quantityAvailableForAssignment ??
      selectedAssignEntry.quantityPending;
    const cleanRows = assignmentRows
      .map((row) => ({
        ...row,
        quantity: Number(row.quantity),
        notes: row.notes.trim(),
      }))
      .filter((row) => row.workerId || row.quantity || row.notes);

    if (!cleanRows.length) {
      toast.error("Agrega al menos una asignacion.");
      return;
    }

    if (cleanRows.some((row) => !row.workerId)) {
      toast.error("Selecciona un trabajador en cada linea.");
      return;
    }

    if (cleanRows.some((row) => row.quantity <= 0)) {
      toast.error("Cada cantidad debe ser mayor a 0.");
      return;
    }

    if (cleanRows.some((row) => !row.assignedAt)) {
      toast.error("Selecciona la fecha de asignacion en cada linea.");
      return;
    }

    const totalToAssign = cleanRows.reduce((total, row) => total + row.quantity, 0);

    if (totalToAssign > availableToAssign) {
      toast.error(
        `Solo hay ${formatInventoryQuantity(availableToAssign)} unidad(es) disponibles para asignar.`,
      );
      return;
    }

    await toast.promise(
      registerAssignment(
        `${inventoryApi}project-entry/${selectedAssignEntry.projectInventoryEntryId}/assign-workers`,
        "POST",
        {
          performedByUserId: user.userId,
          assignments: cleanRows.map((row) => ({
            workerId: row.workerId,
            quantity: row.quantity,
            assignedAt: ymdLocalMidnightToUtc(row.assignedAt, "America/Lima"),
            notes: row.notes || undefined,
          })),
        },
      ),
      {
        loading: "Registrando asignaciones...",
        success: () => {
          setSelectedAssignEntry(null);
          refetch();
          return "Asignaciones registradas exitosamente.";
        },
        error: (err) => err.message || "No se pudieron registrar las asignaciones.",
      },
    );
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;

    await toast.promise(
      deleteAssignment(
        `${inventoryApi}worker-assignment/${assignmentToDelete.workerInventoryAssignmentId}`,
        "DELETE",
      ),
      {
        loading: "Eliminando asignacion...",
        success: () => {
          setAssignmentToDelete(null);
          setSelectedAssignEntry(null);
          refetch();
          return "Asignacion eliminada exitosamente.";
        },
        error: (err) => err.message || "No se pudo eliminar la asignacion.",
      },
    );
  };

  const columns = [
    {
      key: "elementName",
      label: "Elemento",
      width: "18rem",
      render: (row: ProjectInventoryEntry) => (
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{row.elementName}</p>
          {row.fallProtectionGroupId && row.fallProtectionParts?.length ? (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-gray-500">
              {row.fallProtectionParts.join(" | ")}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "elementCode",
      label: "Codigo",
      width: "8rem",
      render: (row: ProjectInventoryEntry) => row.elementCode || "Sin codigo",
    },
    {
      key: "elementType",
      label: "Familia",
      width: "12rem",
      render: (row: ProjectInventoryEntry) => {
        const family = getEntryFamily(row);
        return (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#0047a3]">
            {getInventoryFamilyLabel(family)}
          </span>
        );
      },
    },
    {
      key: "categoryName",
      label: "Categoria",
      width: "10rem",
      render: (row: ProjectInventoryEntry) => row.categoryName || "Sin categoria",
    },
    { key: "quantityReceived", label: "Recibido", width: "6rem", align: "center", render: (row: ProjectInventoryEntry) => formatInventoryQuantity(row.quantityReceived) },
    { key: "quantityAssignedToWorkers", label: "Asignado", width: "6rem", align: "center", render: (row: ProjectInventoryEntry) => formatInventoryQuantity(row.quantityAssignedToWorkers ?? 0) },
    { key: "quantityAvailableForAssignment", label: "En obra", width: "6rem", align: "center", render: (row: ProjectInventoryEntry) => formatInventoryQuantity(row.quantityAvailableForAssignment ?? row.quantityPending) },
    { key: "quantityReturned", label: "Retornado", width: "6rem", align: "center", render: (row: ProjectInventoryEntry) => formatInventoryQuantity(row.quantityReturned) },
    {
      key: "quantityRequiredForProjectClosure",
      label: "Por retornar",
      width: "7rem",
      align: "center",
      render: (row: ProjectInventoryEntry) =>
        ["uniform", "officeMaterial", "ssomaSupply"].includes(getEntryFamily(row)) ? (
          <span className="text-gray-400">No aplica</span>
        ) : (
          formatInventoryQuantity(
            row.quantityRequiredForProjectClosure ?? row.quantityPending,
          )
        ),
    },
    {
      label: "Acciones",
      width: "12rem",
      render: (row: ProjectInventoryEntry) => {
        const family = getEntryFamily(row);
        const availableToReturn =
          row.quantityAvailableForReturn ?? row.quantityPending;
        const availableToAssign =
          row.quantityAvailableForAssignment ?? row.quantityPending;
        const hasAssignments = Boolean(row.workerAssignments?.length);
        const canReturn = canManageInventory
          && ["epp", "epi", "ese", "harness", "officeMaterial"].includes(family)
          && availableToReturn > 0;
        const canAssign = canAssignInventory
          && ["epp", "epi", "uniform", "harness"].includes(family)
          && (availableToAssign > 0 || hasAssignments);

        return (
          <div className="flex items-center gap-2">
            <SeeButton onClick={() => setSelectedDetailEntry(row)} />
            {canAssign ? (
              <ActionButton
                icon={<FaUserPlus className="size-4" />}
                bgColor={
                  selectedAssignEntry?.projectInventoryEntryId === row.projectInventoryEntryId
                    ? "#374151"
                    : "#059669"
                }
                bgHoverColor={
                  selectedAssignEntry?.projectInventoryEntryId === row.projectInventoryEntryId
                    ? "#1f2937"
                    : "#047857"
                }
                onClick={() => {
                  setSelectedEntry(null);
                  setSelectedAssignEntry((current) =>
                    current?.projectInventoryEntryId === row.projectInventoryEntryId
                      ? null
                      : row,
                  );
                }}
              />
            ) : null}
            {family === "ssomaSupply" ? (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                No asignable
              </span>
            ) : null}
            {canReturn ? (
              <ActionButton
                icon={<FaArrowRotateLeft className="size-4" />}
                bgColor={
                  selectedEntry?.projectInventoryEntryId === row.projectInventoryEntryId
                    ? "#374151"
                    : "#0047a3"
                }
                bgHoverColor={
                  selectedEntry?.projectInventoryEntryId === row.projectInventoryEntryId
                    ? "#1f2937"
                    : "#003d8f"
                }
                onClick={() =>
                  {
                    setSelectedAssignEntry(null);
                    setSelectedEntry((current) =>
                      current?.projectInventoryEntryId === row.projectInventoryEntryId
                        ? null
                        : row,
                    );
                  }
                }
              />
            ) : null}
          </div>
        );
      },
    },
  ] as const;

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return data?.entries || [];
    }

    return (data?.entries || []).filter((entry) =>
      [
        entry.elementName,
        entry.elementCode || "",
        entry.categoryName || "",
        entry.responsibleUserName || "",
        getInventoryFamilyLabel(
          getEntryFamily(entry),
        ),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [data?.entries, searchTerm]);

  const tabCounts = useMemo(() => {
    return projectInventoryTabs.reduce(
      (acc, tab) => ({
        ...acc,
        [tab.key]: (data?.entries || []).filter((entry) => getEntryTab(entry) === tab.key)
          .length,
      }),
      {} as Record<ProjectInventoryTab, number>,
    );
  }, [data?.entries]);

  const activeEntries = useMemo(
    () => filteredEntries.filter((entry) => getEntryTab(entry) === activeTab),
    [activeTab, filteredEntries],
  );

  const activeTitle =
    projectInventoryTabs.find((tab) => tab.key === activeTab)?.title ??
    "Inventario";

  const returnBlockerGroups = useMemo(
    () =>
      projectInventoryTabs
        .map((tab) => ({
          ...tab,
          entries: returnBlockers.filter((entry) => getEntryTab(entry) === tab.key),
        }))
        .filter((group) => group.entries.length > 0),
    [returnBlockers],
  );

  const isEntryReturnHighlighted = (entry: ProjectInventoryEntry) =>
    getProjectEntryIds(entry).some((id) => highlightedReturnIds.includes(id));

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (!data) return <ErrorMessage errorMessage="No se encontro el inventario del proyecto." />;

  const selectedFamily = selectedEntry
    ? getEntryFamily(selectedEntry)
    : null;

  return (
    <>
      <div className="flex flex-col gap-6 w-full max-w-full">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">Registros</p>
            <p className="text-3xl font-extrabold text-gray-800">
              {data.summary.totalEntries}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">Pendiente por retorno</p>
            <p className="text-3xl font-extrabold text-[#b45309]">
              {formatInventoryQuantity(data.summary.totalPendingReturn)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">Bloqueos de inactivacion</p>
            <p className="text-3xl font-extrabold text-[#b91c1c]">
              {data.summary.pendingBlockingEntries}
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
            placeholder="Buscar por elemento, codigo, familia o responsable"
          />
        </div>

        <div className="flex flex-wrap items-end gap-8 border-b border-gray-300">
          {projectInventoryTabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                className={`pb-2 text-xl font-extrabold transition-colors ${
                  isActive
                    ? "border-b-4 border-gray-900 text-gray-950"
                    : "text-gray-400 hover:text-gray-700"
                }`}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedEntry(null);
                  setSelectedAssignEntry(null);
                }}
              >
                {tab.label}
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                  {tabCounts[tab.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900">{activeTitle}</h2>

        {selectedEntry ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">
                  Registrar retorno de {selectedEntry.elementName}
                </p>
                <p className="text-sm text-blue-800">
                  Familia: {selectedFamily ? getInventoryFamilyLabel(selectedFamily) : "Sin familia"}.
                  Responsables:{" "}
                  {selectedEntry.responsibleUserNames?.length
                    ? selectedEntry.responsibleUserNames.join(", ")
                    : selectedEntry.responsibleUserName || "Sin responsable"}.
                  Disponible en obra:{" "}
                  {formatInventoryQuantity(
                    selectedEntry.quantityAvailableForReturn ?? selectedEntry.quantityPending,
                  )}.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="returnQuantity">
                    Cantidad
                  </label>
                  <input
                    id="returnQuantity"
                    type="number"
                    min={1}
                    step={1}
                    className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
                    value={returnQuantity}
                    onChange={(event) => setReturnQuantity(Number(event.target.value))}
                  />
                </div>

                <div className="flex min-w-[18rem] flex-col">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="returnNotes">
                    Observacion
                  </label>
                  <input
                    id="returnNotes"
                    type="text"
                    className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
                    value={returnNotes}
                    onChange={(event) => setReturnNotes(event.target.value)}
                    placeholder="Detalle del retorno"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRegisterReturn}
                  disabled={returning}
                  className="rounded-md bg-[#0047a3] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#003d8f] disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {returning ? "Guardando..." : "Confirmar retorno"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {!activeEntries.length ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            {data.entries.length
              ? "No hay elementos que coincidan con la busqueda."
              : "Este proyecto todavia no tiene elementos cargados en inventario."}
          </div>
        ) : activeTab === "fallProtection" ? (
          <FallProtectionProjectCards
            entries={activeEntries}
            canManageInventory={canManageInventory}
            canAssignInventory={canAssignInventory}
            selectedAssignEntryId={selectedAssignEntry?.projectInventoryEntryId}
            selectedReturnEntryId={selectedEntry?.projectInventoryEntryId}
            highlightedEntryIds={highlightedReturnIds}
            onView={setSelectedDetailEntry}
            onAssign={(entry) => {
              setSelectedEntry(null);
              setSelectedAssignEntry((current) =>
                current?.projectInventoryEntryId === entry.projectInventoryEntryId
                  ? null
                  : entry,
              );
            }}
            onReturn={(entry) => {
              setSelectedAssignEntry(null);
              setSelectedEntry((current) =>
                current?.projectInventoryEntryId === entry.projectInventoryEntryId
                  ? null
                  : entry,
              );
            }}
          />
        ) : (
          <Table<ProjectInventoryEntry>
            data={activeEntries}
            columns={columns}
            enablePagination={activeEntries.length > 10}
            rowClassName={(entry, index) =>
              isEntryReturnHighlighted(entry)
                ? "bg-amber-100 hover:bg-amber-200"
                : index % 2 === 0
                  ? "bg-white"
                  : "bg-gray-50"
            }
          />
        )}
      </div>
      {returnBlockerModalOpen && returnBlockerGroups.length ? (
        <ProjectReturnBlockersModal
          groups={returnBlockerGroups}
          onClose={() => setReturnBlockerModalOpen(false)}
        />
      ) : null}
      {selectedDetailEntry ? (
        <ProjectInventoryDetailModal
          entry={selectedDetailEntry}
          familyLabel={getInventoryFamilyLabel(getEntryFamily(selectedDetailEntry))}
          onClose={() => setSelectedDetailEntry(null)}
        />
      ) : null}
      {selectedAssignEntry ? (
        <ProjectInventoryAssignmentModal
          entry={selectedAssignEntry}
          workers={workers || []}
          rows={assignmentRows}
          loading={assigning}
          onRowsChange={setAssignmentRows}
          onSubmit={handleRegisterAssignment}
          onDeleteAssignment={setAssignmentToDelete}
          onClose={() => setSelectedAssignEntry(null)}
        />
      ) : null}
      <DeleteConfirmDialog
        isOpen={Boolean(assignmentToDelete)}
        title="Eliminar asignacion"
        message={`Se eliminara la asignacion de ${assignmentToDelete?.elementName || "este item"} a ${assignmentToDelete?.workerName || "este trabajador"}. Esta accion tambien quitara el movimiento de asignacion del historial.`}
        confirmText="Eliminar asignacion"
        loading={deletingAssignment}
        onCancel={() => setAssignmentToDelete(null)}
        onConfirm={handleDeleteAssignment}
      />
      <Toaster position="top-center" />
    </>
  );
}

function ProjectReturnBlockersModal({
  groups,
  onClose,
}: {
  groups: Array<{
    key: ProjectInventoryTab;
    label: string;
    title: string;
    entries: ProjectInventoryEntry[];
  }>;
  onClose: () => void;
}) {
  const getResponsibleText = (entry: ProjectInventoryEntry) =>
    entry.responsibleUserNames?.length
      ? entry.responsibleUserNames.join(", ")
      : entry.responsibleUserName || "Sin responsable";

  const getPendingText = (entry: ProjectInventoryEntry) =>
    `${formatInventoryQuantity(
      entry.quantityRequiredForProjectClosure ?? entry.quantityPending,
    )} unidad(es)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900">
              Retornos pendientes para finalizar
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Antes de finalizar el proyecto deben retornar estos items al
              inventario de oficina. Las filas correspondientes quedan
              resaltadas temporalmente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
          >
            <FaXmark className="size-5" />
          </button>
        </div>

        <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
          {groups.map((group) => (
            <section
              key={group.key}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <h4 className="mb-3 text-lg font-extrabold text-gray-900">
                {group.label}
              </h4>
              <ul className="flex flex-col gap-3">
                {group.entries.map((entry) => {
                  const code = entry.elementCode ? ` - ${entry.elementCode}` : "";
                  const title =
                    entry.fallProtectionGroup?.code ||
                    `${entry.elementName}${code}`;

                  return (
                    <li
                      key={entry.projectInventoryEntryId}
                      className="rounded-md border border-amber-200 bg-white px-4 py-3"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{title}</p>
                          {entry.fallProtectionParts?.length ? (
                            <p className="mt-1 text-xs text-gray-600">
                              {entry.fallProtectionParts.join(" | ")}
                            </p>
                          ) : null}
                          <p className="mt-1 text-sm text-gray-600">
                            Responsable(s): {getResponsibleText(entry)}
                          </p>
                        </div>
                        <p className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
                          Por retornar: {getPendingText(entry)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function FallProtectionProjectCards({
  entries,
  canManageInventory,
  canAssignInventory,
  selectedAssignEntryId,
  selectedReturnEntryId,
  highlightedEntryIds,
  onView,
  onAssign,
  onReturn,
}: {
  entries: ProjectInventoryEntry[];
  canManageInventory: boolean;
  canAssignInventory: boolean;
  selectedAssignEntryId?: number;
  selectedReturnEntryId?: number;
  highlightedEntryIds: number[];
  onView: (entry: ProjectInventoryEntry) => void;
  onAssign: (entry: ProjectInventoryEntry) => void;
  onReturn: (entry: ProjectInventoryEntry) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {entries.map((entry) => {
        const groupCode =
          entry.fallProtectionGroup?.code ||
          entry.elementCode ||
          entry.elementName ||
          `EPA-${entry.projectInventoryEntryId}`;
        const parts = entry.fallProtectionParts || [];
        const availableToReturn =
          entry.quantityAvailableForReturn ?? entry.quantityPending;
        const availableToAssign =
          entry.quantityAvailableForAssignment ?? entry.quantityPending;
        const hasAssignments = Boolean(entry.workerAssignments?.length);
        const canReturn = canManageInventory && availableToReturn > 0;
        const canAssign = canAssignInventory && (availableToAssign > 0 || hasAssignments);
        const isHighlighted = getProjectEntryIds(entry).some((id) =>
          highlightedEntryIds.includes(id),
        );

        return (
          <article
            key={entry.projectInventoryEntryId}
            className={`rounded-lg border-2 p-4 shadow-sm transition-colors ${
              isHighlighted
                ? "border-amber-400 bg-amber-100"
                : "border-gray-800 bg-white"
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900">
                  {groupCode}
                </h3>
                <p className="text-sm font-semibold text-gray-500">
                  Disponible: {formatInventoryQuantity(availableToAssign)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <SeeButton onClick={() => onView(entry)} />
                {canAssign ? (
                    <ActionButton
                      icon={<FaUserPlus className="size-4" />}
                      bgColor={
                        selectedAssignEntryId === entry.projectInventoryEntryId
                          ? "#374151"
                          : "#059669"
                      }
                      bgHoverColor={
                        selectedAssignEntryId === entry.projectInventoryEntryId
                          ? "#1f2937"
                          : "#047857"
                      }
                      onClick={() => onAssign(entry)}
                    />
                ) : null}
                {canReturn ? (
                    <ActionButton
                      icon={<FaArrowRotateLeft className="size-4" />}
                      bgColor={
                        selectedReturnEntryId === entry.projectInventoryEntryId
                          ? "#374151"
                          : "#0047a3"
                      }
                      bgHoverColor={
                        selectedReturnEntryId === entry.projectInventoryEntryId
                          ? "#1f2937"
                          : "#003d8f"
                      }
                      onClick={() => onReturn(entry)}
                    />
                ) : null}
              </div>
            </div>

            <div className="rounded-md border border-gray-300 p-3">
              <p className="mb-2 text-sm font-extrabold uppercase text-gray-900">
                Partes
              </p>
              {parts.length ? (
                <ul className="flex flex-col gap-1 text-sm text-gray-800">
                  {parts.map((part) => (
                    <li
                      key={part}
                      className="flex items-center justify-between gap-3"
                    >
                      <span>{part}</span>
                      <span className="size-3 shrink-0 rounded-full border border-emerald-500 bg-emerald-100" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Partes no registradas.</p>
              )}
            </div>

            <div className="mt-3 rounded-md border border-gray-300 p-3 text-sm text-gray-800">
              <p className="mb-2 font-extrabold uppercase text-gray-900">
                Datos del equipo
              </p>
              <p>
                <span className="font-bold">Ubicacion actual:</span>{" "}
                {entry.projectName || entry.projectCode || "Proyecto"}
              </p>
              <p>
                <span className="font-bold">Responsable:</span>{" "}
                {entry.responsibleUserNames?.length
                  ? entry.responsibleUserNames.join(", ")
                  : entry.responsibleUserName || "Sin responsable"}
              </p>
              <p>
                <span className="font-bold">Recibido:</span>{" "}
                {formatInventoryQuantity(entry.quantityReceived)}
              </p>
              {entry.notes ? (
                <p className="mt-2 line-clamp-3 text-gray-600">{entry.notes}</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ProjectInventoryDetailModal({
  entry,
  familyLabel,
  onClose,
}: {
  entry: ProjectInventoryEntry;
  familyLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900">
              {entry.elementName}
            </h3>
            <p className="text-sm text-gray-500">
              {familyLabel} · {entry.categoryName || "Sin categoria"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
          >
            <FaXmark className="size-5" />
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <InventoryDetailCard
            label="Recibido"
            value={formatInventoryQuantity(entry.quantityReceived)}
          />
          <InventoryDetailCard
            label="Retornado"
            value={formatInventoryQuantity(entry.quantityReturned)}
          />
          <InventoryDetailCard
            label="En obra"
            value={formatInventoryQuantity(
              entry.quantityAvailableForAssignment ?? entry.quantityPending,
            )}
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InventoryDetailRow label="Codigo" value={entry.elementCode || "Sin codigo"} />
          <InventoryDetailRow
            label="Responsables"
            value={
              entry.responsibleUserNames?.length
                ? entry.responsibleUserNames.join(", ")
                : entry.responsibleUserName || "Sin responsable"
            }
          />
          <InventoryDetailRow
            label="Solicitud"
            value={entry.requestId ? `N° ${entry.requestId}` : "-"}
          />
          <InventoryDetailRow
            label="Proyecto"
            value={entry.projectName || entry.projectCode || "-"}
          />
          <InventoryDetailRow
            label="Tipo"
            value={entry.elementTypeLabel || entry.elementType}
          />
          {entry.family === "ssomaSupply" ? (
            <InventoryDetailRow
              label="Regla"
              value="No retornable, no asignable, control por cantidad"
            />
          ) : null}
        </div>

        {entry.fallProtectionGroupId && entry.fallProtectionParts?.length ? (
          <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 font-extrabold text-gray-900">Partes del grupo EPA</p>
            <ul className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
              {entry.fallProtectionParts.map((part) => (
                <li key={part} className="rounded-md bg-white px-3 py-2">
                  {part}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {entry.notes ? (
          <div className="mt-5 rounded-lg border border-gray-200 p-4">
            <p className="mb-1 font-extrabold text-gray-900">Observacion</p>
            <p className="text-sm text-gray-700">{entry.notes}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProjectInventoryAssignmentModal({
  entry,
  workers,
  rows,
  loading,
  onRowsChange,
  onSubmit,
  onDeleteAssignment,
  onClose,
}: {
  entry: ProjectInventoryEntry;
  workers: Worker[];
  rows: AssignmentDraft[];
  loading: boolean;
  onRowsChange: (rows: AssignmentDraft[]) => void;
  onSubmit: () => void;
  onDeleteAssignment: (assignment: WorkerInventoryAssignment) => void;
  onClose: () => void;
}) {
  const availableToAssign =
    entry.quantityAvailableForAssignment ?? entry.quantityPending;
  const totalDraftQuantity = rows.reduce(
    (total, row) => total + Number(row.quantity || 0),
    0,
  );
  const assignments = entry.workerAssignments || [];

  const updateRow = (
    localId: number,
    patch: Partial<Omit<AssignmentDraft, "localId">>,
  ) => {
    onRowsChange(
      rows.map((row) =>
        row.localId === localId ? { ...row, ...patch } : row,
      ),
    );
  };

  const addRow = () => {
    onRowsChange([
      ...rows,
      {
        localId: Date.now(),
        workerId: 0,
        quantity: 1,
        assignedAt: getTodayDateInputValue(),
        notes: "",
      },
    ]);
  };

  const removeRow = (localId: number) => {
    if (rows.length === 1) {
      onRowsChange([
        {
          localId: Date.now(),
          workerId: 0,
          quantity: 1,
          assignedAt: getTodayDateInputValue(),
          notes: "",
        },
      ]);
      return;
    }

    onRowsChange(rows.filter((row) => row.localId !== localId));
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900">
              Asignar a trabajador
            </h3>
            <p className="text-sm text-gray-500">
              {entry.elementName} · Disponible en obra:{" "}
              {formatInventoryQuantity(availableToAssign)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
          >
            <FaXmark className="size-5" />
          </button>
        </div>

        {assignments.length ? (
          <div className="mb-6 rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <p className="font-extrabold text-gray-900">
                Asignaciones de este item en el proyecto
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] text-sm">
                <thead className="bg-gray-100 text-left text-gray-700">
                  <tr>
                    <th className="px-4 py-3">Trabajador</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-center">Asignado</th>
                    <th className="px-4 py-3 text-center">Retornado</th>
                    <th className="px-4 py-3 text-center">Por retornar</th>
                    <th className="px-4 py-3">Situacion</th>
                    <th className="px-4 py-3">Observacion</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => {
                    const canDeleteAssignment =
                      assignment.status === "active" &&
                      Number(assignment.quantityReturned) <= 0;

                    return (
                      <tr
                        key={assignment.workerInventoryAssignmentId}
                        className="border-t border-gray-100"
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {assignment.workerName || "Sin trabajador"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatDate(assignment.assignedAt)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {formatInventoryQuantity(assignment.quantityAssigned)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {formatInventoryQuantity(assignment.quantityReturned)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {formatInventoryQuantity(assignment.quantityPending)}
                        </td>
                        <td className="px-4 py-3">
                          {getWorkerAssignmentStatusLabel(assignment.status)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {assignment.notes || "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            className="inline-flex size-8 items-center justify-center rounded-md bg-red-600 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            onClick={() => onDeleteAssignment(assignment)}
                            disabled={!canDeleteAssignment}
                            title={
                              canDeleteAssignment
                                ? "Eliminar asignacion"
                                : "No se puede eliminar una asignacion con retornos"
                            }
                          >
                            <FaTrash className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            Todavia no hay asignaciones registradas para este item en este proyecto.
          </div>
        )}

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
            <p className="text-sm font-extrabold uppercase text-gray-700">
              Nueva entrega
            </p>
            {availableToAssign <= 0 ? (
              <p className="text-sm font-semibold text-gray-500">
                No hay unidades disponibles en obra para nuevas asignaciones.
              </p>
            ) : null}
          </div>

          {availableToAssign > 0 ? (
            <>
              <div className="grid gap-3 text-sm font-extrabold uppercase text-gray-700 md:grid-cols-[10rem_1.5fr_8rem_1.4fr_3rem]">
                <span>Fecha de asignacion</span>
                <span>Trabajador</span>
                <span>Cantidad</span>
                <span>Observacion</span>
                <span />
              </div>

              {rows.map((row) => (
                <div
                  key={row.localId}
                  className="grid gap-3 md:grid-cols-[10rem_1.5fr_8rem_1.4fr_3rem]"
                >
                  <input
                    type="date"
                    className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
                    value={row.assignedAt}
                    onChange={(event) =>
                      updateRow(row.localId, { assignedAt: event.target.value })
                    }
                  />

                  <select
                    className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
                    value={row.workerId}
                    onChange={(event) =>
                      updateRow(row.localId, { workerId: Number(event.target.value) })
                    }
                  >
                    <option value={0}>Seleccionar...</option>
                    {workers.map((worker) => (
                      <option key={worker.workerId} value={worker.workerId}>
                        {worker.fullName}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={1}
                    max={availableToAssign}
                    step={1}
                    className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
                    value={row.quantity}
                    onChange={(event) =>
                      updateRow(row.localId, { quantity: Number(event.target.value) })
                    }
                  />

                  <input
                    type="text"
                    className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
                    value={row.notes}
                    onChange={(event) =>
                      updateRow(row.localId, { notes: event.target.value })
                    }
                    placeholder="Detalle de entrega"
                  />

                  <button
                    type="button"
                    onClick={() => removeRow(row.localId)}
                    className="flex size-10 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
                  >
                    <FaXmark className="size-4" />
                  </button>
                </div>
              ))}
            </>
          ) : null}

          {availableToAssign > 0 ? (
            <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={addRow}
              className="rounded-md border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              + Anadir trabajador
            </button>
            <p
              className={`text-sm font-semibold ${
                totalDraftQuantity > availableToAssign
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              Total a asignar: {formatInventoryQuantity(totalDraftQuantity)} /{" "}
              {formatInventoryQuantity(availableToAssign)}
            </p>
          </div>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-100 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || availableToAssign <= 0}
            className="rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? "Guardando..." : "Guardar asignaciones"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InventoryDetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="text-3xl font-extrabold text-gray-900">{value}</p>
    </div>
  );
}

function InventoryDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-bold uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function getWorkerAssignmentStatusLabel(status: string) {
  const normalized = status.toLowerCase();

  const labels: Record<string, string> = {
    active: "Entregado",
    returned: "Retornado",
    partially_returned: "Retorno parcial",
    cancelled: "Cancelado",
    canceled: "Cancelado",
  };

  return labels[normalized] ?? status;
}
