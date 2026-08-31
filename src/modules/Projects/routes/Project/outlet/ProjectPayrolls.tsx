import { Check, ChevronDown, HardHat, Users, WalletCards } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Permission from "../../../../../common/auth/Permission";
import { ErrorMessage } from "../../../../../common/error";
import { Pagination } from "../../../../../common/table";
import { generalPayrollApi } from "../../../../../data/apiUrl";
import { useCurrentUser, useFetch } from "../../../../../hooks";
import type {
  PayrollWorkerGroup,
  ProjectPayrollDetail,
  ProjectPayrollWeekDetail,
} from "../../../../Payrolls/types";
import { adminTypes } from "../../../../../utils";

const PAGE_SIZE = 5;
const dayFields = [
  ["monday", "L"],
  ["tuesday", "M"],
  ["wednesday", "MI"],
  ["thursday", "J"],
  ["friday", "V"],
  ["saturday", "S"],
  ["dominical", "D"],
] as const;

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const moneyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

const groupLabels: Record<PayrollWorkerGroup, string> = {
  laborer: "Obreros",
  technician: "Técnicos",
};

function AttendanceMark({ checked }: { checked: boolean }) {
  return checked ? (
    <motion.span
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      className="mx-auto flex size-7 items-center justify-center rounded-lg bg-[#0047a3] text-white"
      title="Asistió"
    >
      <Check className="size-4" strokeWidth={3} />
    </motion.span>
  ) : (
    <span className="mx-auto block text-center text-gray-300">—</span>
  );
}

function PayrollWeek({
  week,
  initiallyOpen,
}: {
  week: ProjectPayrollWeekDetail;
  initiallyOpen: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <details
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none flex-col justify-between gap-4 p-5 hover:bg-gray-50 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0047a3]">
            Semana
          </p>
          <h2 className="mt-1 font-bold text-[#0f2545]">
            {dateFormatter.format(new Date(week.startDate))} al{" "}
            {dateFormatter.format(new Date(week.endDate))}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {week.workers.length} trabajadores con registros
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">Total pagado</p>
            <p className="text-lg font-extrabold text-emerald-700">
              {moneyFormatter.format(week.totalAmount)}
            </p>
          </div>
          <ChevronDown className="size-5 text-gray-400 transition-transform group-open:rotate-180" />
        </div>
      </summary>

      <div className="overflow-x-auto border-t border-gray-200">
        <table className="min-w-[1500px] w-full border-collapse text-sm">
          <thead className="bg-[#f3f5f8] text-[#0f2545]">
            <tr>
              <th className="min-w-64 px-4 py-3 text-left">Trabajador</th>
              <th className="px-3 py-3 text-left">DNI</th>
              {dayFields.map(([, label]) => (
                <th key={label} className="px-2 py-3 text-center">
                  {label}
                </th>
              ))}
              <th className="px-3 py-3 text-right">Asistencias</th>
              <th className="px-3 py-3 text-right">Jornal</th>
              <th className="px-3 py-3 text-right">H.E.</th>
              <th className="px-3 py-3 text-right">Bruto</th>
              <th className="px-3 py-3 text-right">AFP</th>
              <th className="px-3 py-3 text-right">Adelanto</th>
              <th className="min-w-36 px-4 py-3 text-right">Pagado</th>
            </tr>
          </thead>
          <tbody>
            {(["laborer", "technician"] as const).map((group) => {
              const workers = week.workers.filter(
                (worker) => worker.group === group,
              );
              if (workers.length === 0) return null;
              return [
                <tr
                  key={`${group}-title`}
                  className="bg-[#eaf2ff] text-[#0047a3]"
                >
                  <td
                    colSpan={16}
                    className="px-4 py-2 font-bold uppercase tracking-wide"
                  >
                    {groupLabels[group]}
                  </td>
                </tr>,
                ...workers.map((worker) => (
                  <tr
                    key={worker.generalPayrollEntryId}
                    className="border-t border-gray-100 even:bg-gray-50/60"
                  >
                    <td className="px-4 py-3 font-semibold text-[#0f2545]">
                      {worker.fullName}
                    </td>
                    <td className="px-3 py-3 text-gray-500">{worker.dni}</td>
                    {dayFields.map(([field]) => (
                      <td key={field} className="px-2 py-3 text-center">
                        <AttendanceMark checked={worker.attendance[field]} />
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right font-bold">
                      {worker.attendanceCount}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {moneyFormatter.format(worker.dailyWage)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {moneyFormatter.format(worker.overtimeAmount)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">
                      {moneyFormatter.format(worker.grossAmount)}
                    </td>
                    <td className="px-3 py-3 text-right text-red-600">
                      -{moneyFormatter.format(worker.afpDiscount)}
                    </td>
                    <td className="px-3 py-3 text-right text-red-600">
                      -{moneyFormatter.format(worker.advanceDiscount)}
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-emerald-700">
                      {moneyFormatter.format(worker.paidAmount)}
                    </td>
                  </tr>
                )),
              ];
            })}
          </tbody>
          <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-bold text-[#0f2545]">
            <tr>
              <td colSpan={15} className="px-4 py-4 text-right">
                Total de la semana
              </td>
              <td className="px-4 py-4 text-right text-emerald-700">
                {moneyFormatter.format(week.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </details>
  );
}

export default function ProjectPayrolls() {
  const { user } = useCurrentUser();
  const { id } = useParams<{ id: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const { data, loading, error } = useFetch<ProjectPayrollDetail>(
    id ? `${generalPayrollApi}projects/${id}` : "",
    [id],
  );
  const totalPages = Math.max(
    1,
    Math.ceil((data?.weeks.length ?? 0) / PAGE_SIZE),
  );
  const visibleWeeks =
    data?.weeks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) ??
    [];

  useEffect(() => setCurrentPage(1), [id]);

  return (
    <Permission
      user={user}
      allow={adminTypes}
      fallback={
        <ErrorMessage errorMessage="No tienes permiso para ver esta sección." />
      }
    >
      <main className="flex w-full max-w-full flex-col gap-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0047a3]">
            Detalle por proyecto
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#0f2545]">
            Planillas semanales
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Los importes se calculan desde la planilla general; aquí no se
            registran montos manuales.
          </p>
        </header>

        {loading && (
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
        )}
        {error && <ErrorMessage errorMessage={error} />}

        {!loading && data && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Total pagado",
                  value: moneyFormatter.format(data.totalAmount),
                  icon: WalletCards,
                  color: "text-emerald-700",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Obreros",
                  value: moneyFormatter.format(data.laborerAmount),
                  icon: Users,
                  color: "text-[#0047a3]",
                  bg: "bg-[#eff5ff]",
                },
                {
                  label: "Técnicos",
                  value: moneyFormatter.format(data.technicianAmount),
                  icon: HardHat,
                  color: "text-amber-700",
                  bg: "bg-amber-50",
                },
                {
                  label: "Semanas registradas",
                  value: String(data.weekCount),
                  icon: WalletCards,
                  color: "text-violet-700",
                  bg: "bg-violet-50",
                },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <span
                    className={`mb-4 flex size-10 items-center justify-center rounded-xl ${bg} ${color}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <p className="text-xs font-semibold text-gray-500">{label}</p>
                  <p className={`mt-1 text-xl font-extrabold ${color}`}>
                    {value}
                  </p>
                </div>
              ))}
            </section>

            {visibleWeeks.length > 0 ? (
              <section className="space-y-4">
                {visibleWeeks.map((week, index) => (
                  <PayrollWeek
                    key={week.weekId}
                    week={week}
                    initiallyOpen={index === 0}
                  />
                ))}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={data.weeks.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </section>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
                Este proyecto aún no tiene asistencias ni pagos registrados en
                la planilla general.
              </div>
            )}
          </>
        )}
      </main>
    </Permission>
  );
}
