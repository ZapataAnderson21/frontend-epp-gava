import { useMemo, useState } from "react";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { workerApi } from "../../data/apiUrl";
import { type Worker } from "../../data/types";
import { useFetch } from "../../hooks";
import { EditButton, SeeButton } from "../../common/button";

interface ProjectTableProps {
  reFetch: number;
  onSee: (workerId: number) => void;
  isAdmin: boolean;
}

const workerTypeOptions = [
  "Todos",
  "Obrero",
  "Técnico",
  "Ingeniero",
  "Administrador(a)",
  "Gerente",
];

export default function WorkerTable({ reFetch, onSee, isAdmin }: ProjectTableProps) {
  const { data: workers, loading, error } = useFetch<Worker[]>(`${workerApi}`, [reFetch]);
  const [search, setSearch] = useState("");
  const [workerTypeFilter, setWorkerTypeFilter] = useState("Todos");

  const normalizedWorkers = useMemo(
    () =>
      (workers ?? []).map((worker) => ({
        ...worker,
        workerType: normalizeWorkerTypeLabel(worker.workerType),
      })),
    [workers],
  );

  const workerTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    workerTypeOptions.slice(1).forEach((type) => counts.set(type, 0));

    normalizedWorkers.forEach((worker) => {
      counts.set(worker.workerType, (counts.get(worker.workerType) ?? 0) + 1);
    });

    return counts;
  }, [normalizedWorkers]);

  const filteredWorkers = useMemo(() => {
    const query = normalizeText(search);

    return normalizedWorkers.filter((worker) => {
      const matchesType =
        workerTypeFilter === "Todos" || worker.workerType === workerTypeFilter;
      const searchText = normalizeText(
        [
          worker.fullName,
          worker.dni,
          worker.phone,
          worker.personalEmail,
          worker.workerType,
        ].join(" "),
      );

      return matchesType && (!query || searchText.includes(query));
    });
  }, [normalizedWorkers, search, workerTypeFilter]);

  const columns = [
    { key: "fullName", label: "Nombre Completo", width: "18rem" },
    { key: "phone", label: "Teléfono", width: "14rem" },
    { key: "personalEmail", label: "Correo Electrónico", width: "18rem" },
    { key: "workerType", label: "Tipo", width: "14rem" },
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

  if (loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!workers || workers.length === 0) {
    return <div className="text-center text-gray-500">No se encontraron trabajadores.</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {workerTypeOptions.slice(1).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setWorkerTypeFilter(type)}
            className={`rounded-md border p-4 text-left shadow-sm transition ${
              workerTypeFilter === type
                ? "border-[#0047a3] bg-blue-50"
                : "border-gray-200 bg-white hover:border-[#0047a3]"
            }`}
          >
            <p className="text-xs font-bold uppercase text-gray-500">{type}</p>
            <p className="mt-2 text-3xl font-extrabold text-gray-900">
              {workerTypeCounts.get(type) ?? 0}
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
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold outline-none focus:border-[#0047a3] md:max-w-md"
        />

        <select
          value={workerTypeFilter}
          onChange={(event) => setWorkerTypeFilter(event.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold outline-none focus:border-[#0047a3]"
        >
          {workerTypeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {filteredWorkers.length ? (
        <Table<Worker> data={filteredWorkers} columns={columns} />
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

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
