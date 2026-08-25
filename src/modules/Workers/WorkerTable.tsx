import { useEffect, useMemo, useState } from "react";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { workerApi } from "../../data/apiUrl";
import { type Worker } from "../../data/types";
import { useDebouncedValue, usePaginatedFetch } from "../../hooks";
import type { PaginatedData } from "../../common/table";
import { EditButton, SeeButton } from "../../common/button";
import { formatDate } from "../../utils";

interface ProjectTableProps {
  reFetch: number;
  onSee: (workerId: number) => void;
  isAdmin: boolean;
}

const workerTypeOptions = [
  { value: "all", label: "Todos" },
  { value: "laborer", label: "Obrero" },
  { value: "technician", label: "Técnico" },
  { value: "engineer", label: "Ingeniero" },
  { value: "administrator", label: "Administrador(a)" },
  { value: "manager", label: "Gerente" },
];

type WorkerPageData = PaginatedData<Worker> & {
  workerTypeCounts: Record<string, number>;
};

export default function WorkerTable({ reFetch, onSee, isAdmin }: ProjectTableProps) {
  const [search, setSearch] = useState("");
  const [workerTypeFilter, setWorkerTypeFilter] = useState("all");
  const debouncedSearch = useDebouncedValue(search);
  const {
    data,
    items: workers,
    pagination,
    loading,
    error,
    refetch,
    setPage,
    setPageSize,
  } = usePaginatedFetch<Worker>(`${workerApi}paginated`, {
    params: {
      search: debouncedSearch,
      workerType: workerTypeFilter !== "all" ? workerTypeFilter : undefined,
    },
  });

  useEffect(() => {
    refetch();
  }, [reFetch, refetch]);

  const normalizedWorkers = useMemo(
    () =>
      workers.map((worker) => ({
        ...worker,
        workerType: normalizeWorkerTypeLabel(worker.workerType),
      })),
    [workers],
  );

  const workerTypeCounts =
    (data as WorkerPageData | null)?.workerTypeCounts ?? {};
  const allWorkerCount = Object.values(workerTypeCounts).reduce(
    (total, count) => total + count,
    0,
  );

  const columns = [
    { key: "fullName", label: "Nombre Completo", width: "18rem" },
    { key: "dni", label: "DNI", width: "9rem" },
    {
      key: "birthDate",
      label: "Fecha de Nacimiento",
      width: "12rem",
      render: (row: Worker) => formatDate(row.birthDate),
    },
    { key: "phone", label: "Teléfono", width: "10rem" },
    { key: "personalEmail", label: "Correo Electrónico", width: "18rem" },
    { key: "workerType", label: "Tipo", width: "11rem" },
    ...(isAdmin
      ? [
          {
            label: "Acciones",
            width: "8rem",
            render: (row: Worker) => <EditButton onClick={() => onSee(row.workerId)} />,
          },
        ]
      : [
          {
            label: "Acciones",
            width: "8rem",
            render: (row: Worker) => <SeeButton onClick={() => onSee(row.workerId)} />,
          },
        ]),
  ] as const;

  if (loading && !pagination) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!workers.length && !search && workerTypeFilter === "all") {
    return <div className="text-center text-gray-500">No se encontraron trabajadores.</div>;
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {workerTypeOptions.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => setWorkerTypeFilter(type.value)}
            className={`rounded-md border p-4 text-left shadow-sm transition ${
              workerTypeFilter === type.value
                ? "border-[#0047a3] bg-blue-50"
                : "border-gray-200 bg-white hover:border-[#0047a3]"
            }`}
          >
            <p className="text-2xs font-bold uppercase text-gray-500">{type.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">
              {type.value === "all"
                ? allWorkerCount
                : workerTypeCounts[type.value] ?? 0}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, DNI, teléfono o correo"
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold outline-none focus:border-[#0047a3] md:max-w-md"
        />

        <select
          value={workerTypeFilter}
          onChange={(event) => setWorkerTypeFilter(event.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold outline-none focus:border-[#0047a3]"
        >
          {workerTypeOptions.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {normalizedWorkers.length ? (
        <Table<Worker>
          data={normalizedWorkers}
          columns={columns}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={loading}
          getRowKey={(row) => row.workerId}
        />
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No hay trabajadores que coincidan con los filtros.
        </div>
      )}
    </div>
  );
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
