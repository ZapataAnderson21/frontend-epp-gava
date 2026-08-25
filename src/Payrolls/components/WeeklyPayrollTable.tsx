import { useMemo, useState } from "react";
import { Search as FaSearch } from "lucide-react";
import { Table } from "../../common/table";
import { type WorkersPayroll } from "../../data/types";

interface PayrollTableProps {
  title: string;
  workers: WorkersPayroll[];
  searchPlaceholder: string;
  onWageChange: (workerId: number, value: number) => void;
}

export function WeeklyPayrollTable({
  title,
  workers,
  searchPlaceholder,
  onWageChange,
}: PayrollTableProps) {
  const [search, setSearch] = useState("");

  const filteredWorkers = useMemo(
    () =>
      workers.filter(w =>
        w.workerName.toLowerCase().includes(search.toLowerCase())
      ),
    [workers, search]
  );

  const columns = [
    { key: "workerName" as const, label: "Nombre", width: "18rem" },
    {
      key: "attendances" as const,
      label: "N° asistencias",
      width: "10rem",
      align: "center" as const,
    },
    {
      label: "Pago por jornada (S/)",
      width: "12rem",
      align: "center" as const,
      render: (row: WorkersPayroll) => (
        <input
          type="number"
          min={0}
          value={row.dailyWage ?? 0}
          onChange={e =>
            onWageChange(row.workerId, Number(e.target.value) || 0)
          }
          className="w-24 border border-gray-300 rounded-md px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      ),
    },
    {
      label: "Pago semanal (S/)",
      width: "12rem",
      align: "right" as const,
      render: (row: WorkersPayroll) => {
        const weekly = row.attendances * (row.dailyWage ?? 0);
        return `S/ ${weekly.toFixed(2)}`;
      },
    },
  ] as const;

  return (
    <section className="w-full mb-10">
      <h2 className="text-base font-bold mb-2">{title}</h2>

      <div className="mb-4 max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <Table<WorkersPayroll> data={filteredWorkers} columns={columns} />
    </section>
  );
}