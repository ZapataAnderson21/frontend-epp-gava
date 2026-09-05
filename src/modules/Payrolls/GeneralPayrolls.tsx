import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  FileSpreadsheet,
  Filter,
  LoaderCircle,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { Pagination } from "../../common/table";
import Select from "../../components/Select";
import { generalPayrollApi } from "../../data/apiUrl";
import { useFetch } from "../../hooks";
import getAuthHeaders from "../../hooks/getAuthHeaders";
import type { GeneralPayrollWeekCard } from "./types";

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
] as const;

const PAGE_SIZE = 9;

function getCoveredPeriods(week: GeneralPayrollWeekCard) {
  const start = new Date(week.startDate);
  const end = new Date(week.endDate);
  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const periods = new Set<string>();

  while (cursor.getTime() <= end.getTime()) {
    periods.add(`${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return periods;
}

export default function GeneralPayrolls() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(-1);
  const [year, setYear] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportingWeekId, setExportingWeekId] = useState<number | null>(null);
  const {
    data: weeks,
    loading,
    error,
  } = useFetch<GeneralPayrollWeekCard[]>(`${generalPayrollApi}weeks`);

  const years = useMemo(() => {
    const values = new Set<number>();
    weeks?.forEach((week) => {
      getCoveredPeriods(week).forEach((period) => {
        values.add(Number(period.split("-")[0]));
      });
    });
    return [...values].sort((a, b) => b - a);
  }, [weeks]);

  const filteredWeeks = useMemo(
    () =>
      (weeks ?? []).filter((week) => {
        if (month === -1 && year === 0) return true;
        return [...getCoveredPeriods(week)].some((period) => {
          const [periodYear, periodMonth] = period.split("-").map(Number);
          const matchesMonth = month === -1 || periodMonth === month;
          const matchesYear = year === 0 || periodYear === year;
          return matchesMonth && matchesYear;
        });
      }),
    [month, weeks, year],
  );

  const totalPages = Math.max(1, Math.ceil(filteredWeeks.length / PAGE_SIZE));
  const visibleWeeks = filteredWeeks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [month, year]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleExport = async (week: GeneralPayrollWeekCard) => {
    if (!week.initialized || week.projectCount === 0 || exportingWeekId) return;

    setExportingWeekId(week.weekId);
    try {
      const response = await fetch(
        `${generalPayrollApi}weeks/${week.weekId}/export/excel`,
        { headers: getAuthHeaders() },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string | string[];
        } | null;
        const message = Array.isArray(payload?.message)
          ? payload.message.join(" ")
          : payload?.message;
        throw new Error(message || "No se pudo generar el Excel.");
      }

      const disposition = response.headers.get("Content-Disposition") ?? "";
      const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
      const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
      const fileName = encodedName
        ? decodeURIComponent(encodedName)
        : plainName || `planilla_semana_${week.weekId}.xlsx`;
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Planilla exportada correctamente.");
    } catch (downloadError) {
      toast.error(
        downloadError instanceof Error
          ? downloadError.message
          : "No se pudo generar el Excel.",
      );
    } finally {
      setExportingWeekId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 md:p-8">
      <Toaster position="top-right" />
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#0047a3]">
          Gestión semanal
        </p>
        <h1 className="text-3xl font-bold text-[#0f2545]">Planillas</h1>
        <p className="mt-2 max-w-3xl text-gray-600">
          Selecciona una semana para configurar sus proyectos, organizar el
          padrón de trabajadores y registrar los importes de cada obra.
        </p>
      </div>

      {!loading && !error && Boolean(weeks?.length) && (
        <section className="mb-7 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-[#eff5ff] p-3 text-[#0047a3]">
              <Filter className="size-5" />
            </span>
            <div>
              <h2 className="font-bold text-[#0f2545]">Filtrar semanas</h2>
              <p className="text-xs text-gray-500">
                Las semanas que cruzan un mes o año aparecen en ambos períodos.
              </p>
            </div>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 md:w-auto md:min-w-[28rem]">
            <label className="min-w-0 text-sm font-semibold text-[#0f2545]">
              <span className="mb-1 block">Mes</span>
              <Select<number>
                name="payrollMonth"
                value={month}
                onChange={setMonth}
                options={[
                  { value: -1, label: "Todos los meses" },
                  ...months.map((label, value) => ({ value, label })),
                ]}
              />
            </label>
            <label className="min-w-0 text-sm font-semibold text-[#0f2545]">
              <span className="mb-1 block">Año</span>
              <Select<number>
                name="payrollYear"
                value={year}
                onChange={setYear}
                options={[
                  { value: 0, label: "Todos los años" },
                  ...years.map((value) => ({ value, label: String(value) })),
                ]}
              />
            </label>
          </div>
        </section>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-52 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && weeks?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
          Todavía no hay semanas registradas.
        </div>
      )}

      {!loading &&
        !error &&
        weeks?.length !== 0 &&
        filteredWeeks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
            No hay semanas que coincidan con los filtros seleccionados.
          </div>
        )}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {visibleWeeks.map((week) => {
          const canExport = week.initialized && week.projectCount > 0;
          const isExporting = exportingWeekId === week.weekId;
          return (
            <article
              key={week.weekId}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-[#0047a3]/40 hover:shadow-lg"
            >
              <button
                type="button"
                onClick={() => navigate(`/admin/payrolls/${week.weekId}`)}
                className="w-full cursor-pointer p-5 pb-4 text-left"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <span className="rounded-xl bg-[#eff5ff] p-3 text-[#0047a3]">
                    <CalendarDays className="size-6" />
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      week.initialized
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {week.initialized ? "En edición" : "Sin configurar"}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-[#0f2545]">
                  {dateFormatter.format(new Date(week.startDate))}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  al {dateFormatter.format(new Date(week.endDate))}
                </p>

                <div className="my-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <BriefcaseBusiness className="mb-1 size-4 text-gray-500" />
                    <p className="text-xl font-bold text-[#0f2545]">
                      {week.projectCount}
                    </p>
                    <p className="text-xs text-gray-500">Proyectos</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <Users className="mb-1 size-4 text-gray-500" />
                    <p className="text-xl font-bold text-[#0f2545]">
                      {week.workerCount}
                    </p>
                    <p className="text-xs text-gray-500">Trabajadores</p>
                  </div>
                </div>
              </button>

              <div className="mx-5 flex items-center justify-between gap-3 border-t border-gray-100 py-4">
                <div>
                  <p className="text-xs text-gray-500">Neto registrado</p>
                  <p className="font-bold text-[#0047a3]">
                    {moneyFormatter.format(week.totalAmount)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!canExport || exportingWeekId !== null}
                    title={
                      canExport
                        ? "Exportar planilla semanal a Excel"
                        : "Configura proyectos en la semana antes de exportar"
                    }
                    onClick={() => void handleExport(week)}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    {isExporting ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="size-4" />
                    )}
                    {isExporting ? "Generando..." : "Excel"}
                  </button>
                  <button
                    type="button"
                    aria-label={`Abrir planilla de la semana del ${dateFormatter.format(new Date(week.startDate))}`}
                    onClick={() => navigate(`/admin/payrolls/${week.weekId}`)}
                    className="cursor-pointer rounded-lg p-2 text-[#0047a3] transition hover:bg-[#eff5ff]"
                  >
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {!loading && !error && filteredWeeks.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredWeeks.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}
    </main>
  );
}
