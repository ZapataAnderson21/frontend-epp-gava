import { useMemo, useState } from "react";
import { Search as FaSearch } from "lucide-react";
import { Table } from "../../../common/table";
import type { WorkerPayrollDetail } from "../types";

interface GeneralPayrollTableProps {
  title: string;
  workers: WorkerPayrollDetail[];
  searchPlaceholder: string;
  onAfpChange: (workerId: number, value: number) => void;
  onAdvanceChange: (workerId: number, value: number) => void;
}

export function GeneralPayrollTable({
  title,
  workers,
  searchPlaceholder,
}: GeneralPayrollTableProps) {
  const [search, setSearch] = useState("");

  const filteredWorkers = useMemo(
    () =>
      workers.filter((w) =>
        w.workerName.toLowerCase().includes(search.toLowerCase())
      ),
    [workers, search]
  );

  const columns = [
    {
      label: "Nombre",
      width: "14rem",
      render: (row: WorkerPayrollDetail) => row.workerName,
    },
    {
      label: "Asist.",
      width: "5rem",
      align: "center" as const,
      render: (row: WorkerPayrollDetail) => row.attendances,
    },
    {
      label: "Pago/día",
      width: "7rem",
      align: "right" as const,
      render: (row: WorkerPayrollDetail) => `S/ ${row.dailyWage.toFixed(2)}`,
    },
    {
      label: "Bruto",
      width: "8rem",
      align: "right" as const,
      render: (row: WorkerPayrollDetail) => `S/ ${row.grossAmount.toFixed(2)}`,
    },
    {
      label: "Pago Semanal",
      width: "9rem",
      align: "right" as const,
      render: (row: WorkerPayrollDetail) => (
        <span className="font-bold text-green-700">
          S/ {row.weeklyWage.toFixed(2)}
        </span>
      ),
    },
  ] as const;

  // Calcular totales del grupo
  const totals = useMemo(() => {
    return filteredWorkers.reduce(
      (acc, w) => ({
        attendances: acc.attendances + w.attendances,
        gross: acc.gross + w.grossAmount,
        afp: acc.afp + w.afpDiscount,
        advance: acc.advance + w.advanceDiscount,
        net: acc.net + w.weeklyWage,
      }),
      { attendances: 0, gross: 0, afp: 0, advance: 0, net: 0 }
    );
  }, [filteredWorkers]);

  return (
    <section className="w-full mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-base font-bold">{title}</h2>

        <div className="max-w-xs w-full">
          <div className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      <Table<WorkerPayrollDetail> data={filteredWorkers} columns={columns} />

      {/* Fila de totales */}
      {filteredWorkers.length > 0 && (
        <div className="mt-2 bg-gray-100 rounded-md p-3 flex flex-wrap gap-4 justify-end text-xs font-semibold">
          <span>Total Asist.: {totals.attendances}</span>
          <span>Bruto: S/ {totals.gross.toFixed(2)}</span>
          <span className="text-green-700">Neto: S/ {totals.net.toFixed(2)}</span>
        </div>
      )}
    </section>
  );
}
