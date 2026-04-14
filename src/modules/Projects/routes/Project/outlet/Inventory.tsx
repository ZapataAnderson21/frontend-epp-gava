import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { Table } from "../../../../../common/table";
import { ErrorMessage } from "../../../../../common/error";
import { LoadingSkeletonTable } from "../../../../../common/loading";
import { useApiAction, useCurrentUser, useFetch } from "../../../../../hooks";
import { inventoryApi } from "../../../../../data/apiUrl";
import type {
  ProjectInventoryEntry,
  ProjectInventoryResponse,
} from "../../../../../data/types";
import { SeeButton } from "../../../../../common/button";
import { logisticsTypes, riskPreventionTypes } from "../../../../../utils";
import {
  formatInventoryQuantity,
  getInventoryFamilyConfig,
  getInventoryFamilyFromSource,
  getInventoryFamilyLabel,
} from "../../../../Elements/inventoryCatalog";

export default function ProjectInventory() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const { data, loading, error, refetch } = useFetch<ProjectInventoryResponse>(
    projectId ? `${inventoryApi}project/${projectId}` : "",
    [projectId],
  );

  const { execute: registerReturn, loading: returning } =
    useApiAction<ProjectInventoryEntry>();

  const [selectedEntry, setSelectedEntry] = useState<ProjectInventoryEntry | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnNotes, setReturnNotes] = useState("");

  useEffect(() => {
    if (!selectedEntry) {
      setReturnQuantity(1);
      setReturnNotes("");
      return;
    }

    const family = getInventoryFamilyFromSource({
      type: selectedEntry.elementType,
      controlType: selectedEntry.controlType,
      code: selectedEntry.elementCode,
    });
    const familyConfig = getInventoryFamilyConfig(family);

    setReturnQuantity(
      selectedEntry.quantityPending > 0
        ? familyConfig?.consumable && selectedEntry.quantityPending < 1
          ? selectedEntry.quantityPending
          : Math.min(selectedEntry.quantityPending, 1)
        : 0,
    );
    setReturnNotes("");
  }, [selectedEntry]);

  const canManageReturn = useMemo(() => {
    if (!user) return false;

    return (
      logisticsTypes.includes(user.userType) ||
      riskPreventionTypes.includes(user.userType)
    );
  }, [user]);

  const handleRegisterReturn = async () => {
    if (!selectedEntry || !user) return;

    if (returnQuantity <= 0) {
      toast.error("La cantidad a retornar debe ser mayor a 0.");
      return;
    }

    if (returnQuantity > selectedEntry.quantityPending) {
      toast.error("La cantidad supera el pendiente por retornar.");
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

  const columns = [
    { key: "elementName", label: "Elemento", width: "16rem" },
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
        const family = getInventoryFamilyFromSource({
          type: row.elementType,
          controlType: row.controlType,
          code: row.elementCode,
        });
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
    {
      key: "responsibleUserName",
      label: "Responsable",
      width: "14rem",
      render: (row: ProjectInventoryEntry) =>
        row.responsibleUserName || "Sin responsable",
    },
    { key: "unit", label: "Unidad", width: "7rem" },
    { key: "quantityReceived", label: "Recibido", width: "6rem", align: "center", render: (row: ProjectInventoryEntry) => formatInventoryQuantity(row.quantityReceived) },
    { key: "quantityReturned", label: "Retornado", width: "6rem", align: "center", render: (row: ProjectInventoryEntry) => formatInventoryQuantity(row.quantityReturned) },
    { key: "quantityPending", label: "Pendiente", width: "6rem", align: "center", render: (row: ProjectInventoryEntry) => formatInventoryQuantity(row.quantityPending) },
    {
      label: "Acciones",
      width: "12rem",
      render: (row: ProjectInventoryEntry) => {
        const family = getInventoryFamilyFromSource({
          type: row.elementType,
          controlType: row.controlType,
          code: row.elementCode,
        });
        const familyConfig = getInventoryFamilyConfig(family);
        const canReturn = canManageReturn && familyConfig?.returnsToOffice && row.quantityPending > 0;

        return (
          <div className="flex items-center gap-2">
            <SeeButton onClick={() => navigate(`/admin/elements/${row.elementId}`)} />
            {canReturn ? (
              <button
                type="button"
                className={`rounded-md px-3 py-2 text-xs font-semibold text-white transition-colors ${
                  selectedEntry?.projectInventoryEntryId === row.projectInventoryEntryId
                    ? "bg-gray-700 hover:bg-gray-800"
                    : "bg-[#0047a3] hover:bg-[#003d8f]"
                }`}
                onClick={() =>
                  setSelectedEntry((current) =>
                    current?.projectInventoryEntryId === row.projectInventoryEntryId
                      ? null
                      : row,
                  )
                }
              >
                {selectedEntry?.projectInventoryEntryId === row.projectInventoryEntryId
                  ? "Cancelar"
                  : "Retornar"}
              </button>
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
          getInventoryFamilyFromSource({
            type: entry.elementType,
            controlType: entry.controlType,
            code: entry.elementCode,
          }),
        ),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [data?.entries, searchTerm]);

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (!data) return <ErrorMessage errorMessage="No se encontro el inventario del proyecto." />;

  const selectedFamily = selectedEntry
    ? getInventoryFamilyFromSource({
        type: selectedEntry.elementType,
        controlType: selectedEntry.controlType,
        code: selectedEntry.elementCode,
      })
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

        {selectedEntry ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">
                  Registrar retorno de {selectedEntry.elementName}
                </p>
                <p className="text-sm text-blue-800">
                  Familia: {selectedFamily ? getInventoryFamilyLabel(selectedFamily) : "Sin familia"}.
                  Responsable actual: {selectedEntry.responsibleUserName || "Sin responsable"}.
                  Pendiente: {formatInventoryQuantity(selectedEntry.quantityPending)} {selectedEntry.unit}.
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
                    min={selectedFamily === "consumibles" ? 0.01 : 1}
                    step={selectedFamily === "consumibles" ? 0.01 : 1}
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

        {!filteredEntries.length ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            {data.entries.length
              ? "No hay elementos que coincidan con la busqueda."
              : "Este proyecto todavia no tiene elementos cargados en inventario."}
          </div>
        ) : (
          <Table<ProjectInventoryEntry>
            data={filteredEntries}
            columns={columns}
            enablePagination={filteredEntries.length > 10}
          />
        )}
      </div>
      <Toaster position="top-center" />
    </>
  );
}
