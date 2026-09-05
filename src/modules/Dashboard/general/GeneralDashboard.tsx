import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Select from "../../../components/Select";
import { dashboardApi } from "../../../data/apiUrl";
import { useFetch } from "../../../hooks";
import type { GeneralDashboardData } from "./types";
import { money, shortDate } from "./format";
import { ExpenseChart, ProjectExpenseChart, TrendChart } from "./GeneralCharts";

const actionClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-blue-600";

function Metric({
  label,
  value,
  note,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
  tone?: "blue" | "green" | "red";
}) {
  const color = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
  }[tone];
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <span className={`rounded-lg p-2 [&>svg]:size-4 ${color}`}>{icon}</span>
      </div>
      <p className="mt-3 break-words text-xl font-bold tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{note}</p>
    </article>
  );
}

function comparison(current: number, previous: number) {
  if (previous <= 0) return "Sin base comparable del mes anterior";
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}% respecto al mes anterior`;
}

function ProjectTable({
  data,
  currency,
}: {
  data: GeneralDashboardData;
  currency: string;
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(data.projects.length / 8));
  const safePage = Math.min(page, pageCount);
  const rows = data.projects.slice((safePage - 1) * 8, safePage * 8);
  const statuses = {
    active: "Activo",
    inactive: "Inactivo",
    completed: "Completado",
  };
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5">
        <h2 className="font-bold text-slate-900">Resumen de proyectos</h2>
        <p className="mt-1 text-xs text-slate-500">
          Economía del mes seleccionado. Avance por tareas y pendientes
          actuales.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-3">Proyecto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Avance por tareas</th>
              <th className="px-4 py-3">Término</th>
              {data.finances && (
                <>
                  <th className="px-4 py-3 text-right">Gastos ({currency})</th>
                  <th className="px-4 py-3 text-right">
                    Resultado ({currency})
                  </th>
                </>
              )}
              <th className="px-4 py-3">Pendientes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((project) => (
              <tr key={project.projectId} className="hover:bg-slate-50/70">
                <td className="max-w-72 px-5 py-4">
                  <Link
                    to={`/admin/projects/${project.projectId}`}
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    {project.code}
                  </Link>
                  <p className="mt-1 text-slate-600">{project.name}</p>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`whitespace-nowrap rounded-full px-2 py-1 ${project.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {statuses[project.status]}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {project.progress === null ? (
                    <span className="text-slate-400">Sin tareas</span>
                  ) : (
                    <>
                      <span className="font-semibold">{project.progress}%</span>
                      <div className="mt-2 h-1.5 w-24 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </>
                  )}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-4 ${project.overdue ? "text-rose-700" : "text-slate-600"}`}
                >
                  {project.endDate ? shortDate(project.endDate) : "Sin fecha"}
                  {project.overdue && (
                    <p className="mt-1 font-semibold">Fuera de plazo</p>
                  )}
                </td>
                {data.finances && (
                  <>
                    <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">
                      {money(project.finances!.expenses, currency)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums ${project.finances!.result < 0 ? "text-rose-700" : "text-emerald-700"}`}
                    >
                      {money(project.finances!.result, currency)}
                    </td>
                  </>
                )}
                <td className="px-4 py-4 text-slate-600">
                  {project.overdueTasks +
                  project.pendingRequests +
                  project.pendingOrders ? (
                    <div className="space-y-1">
                      {!!project.overdueTasks && (
                        <p>{project.overdueTasks} tareas vencidas</p>
                      )}
                      {!!project.pendingRequests && (
                        <p>{project.pendingRequests} req. vencidos</p>
                      )}
                      {!!project.pendingOrders && (
                        <p>{project.pendingOrders} OC antiguas</p>
                      )}
                    </div>
                  ) : (
                    "Sin pendientes detectados"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="py-10 text-center text-sm text-slate-500">
            No hay proyectos para mostrar.
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        <span>
          {data.projects.length} proyectos · Página {safePage} de {pageCount}
        </span>
        <div className="flex gap-2">
          <button
            className={actionClass}
            aria-label="Página anterior de proyectos"
            disabled={safePage === 1}
            onClick={() => setPage(safePage - 1)}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            className={actionClass}
            aria-label="Página siguiente de proyectos"
            disabled={safePage === pageCount}
            onClick={() => setPage(safePage + 1)}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function WeeklyPayroll({
  payroll,
}: {
  payroll: NonNullable<GeneralDashboardData["payroll"]>;
}) {
  const [weekId, setWeekId] = useState(0);
  const week =
    payroll.weeks.find((item) => item.weekId === weekId) ?? payroll.weeks[0];
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900">Planilla semanal</h2>
          <p className="mt-1 text-xs text-slate-500">
            Siempre en soles ·{" "}
            {payroll.projectOnly
              ? "Neto base del proyecto"
              : "Neto final general"}
          </p>
        </div>
        {week && (
          <Select<number>
            name="generalPayrollWeek"
            ariaLabel="Semana de planilla"
            value={week.weekId}
            onChange={setWeekId}
            className="w-full sm:w-80"
            options={payroll.weeks.map((item) => ({
              value: item.weekId,
              label: `${shortDate(item.startDate)} — ${shortDate(item.endDate)}`,
            }))}
          />
        )}
      </div>
      {week ? (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50 p-4">
            <div>
              <p className="text-xs text-blue-700">
                {payroll.projectOnly
                  ? "Neto base semanal"
                  : "Neto final semanal"}
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-950 tabular-nums">
                {money(week.total)}
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
              to={`/admin/payrolls/${week.weekId}`}
            >
              Abrir semana <ArrowUpRight className="size-4" />
            </Link>
          </div>
          {!week.includedInMonth && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              Esta semana cruza meses: se muestra aquí, pero su importe se
              contabiliza en el mes de término ({shortDate(week.endDate)}).
            </p>
          )}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[580px] text-right text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3 text-left">Grupo</th>
                  <th className="pb-3">Trabajadores*</th>
                  <th className="pb-3">Asistencias L–S</th>
                  <th className="pb-3">Dominical</th>
                  <th className="pb-3">Neto base</th>
                  {!payroll.projectOnly && (
                    <th className="pb-3">Adicionales**</th>
                  )}
                  <th className="pb-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {week.groups.map((group) => (
                  <tr key={group.group} className="border-t border-slate-100">
                    <td className="py-4 text-left font-semibold">
                      {group.group === "laborer" ? "Obreros" : "Técnicos"}
                    </td>
                    <td>{group.workerCount}</td>
                    <td>{group.attendances}</td>
                    <td>{group.dominical}</td>
                    <td className="whitespace-nowrap">{money(group.base)}</td>
                    {!payroll.projectOnly && (
                      <td className="whitespace-nowrap">
                        {money(group.adjustments)}
                      </td>
                    )}
                    <td className="whitespace-nowrap font-semibold">
                      {money(group.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            * Trabajadores únicos con asistencia de lunes a sábado. Dominical se
            muestra aparte.
            {!payroll.projectOnly &&
              " ** Otros adicionales, liquidación y comida domingo, contabilizados una sola vez."}
          </p>
        </>
      ) : (
        <p className="py-10 text-center text-sm text-slate-500">
          No hay planillas configuradas que coincidan con este mes y proyecto.
        </p>
      )}
    </section>
  );
}

export default function GeneralDashboard({
  month,
  year,
}: {
  month: number;
  year: number;
}) {
  const [projectId, setProjectId] = useState(0);
  const [currency, setCurrency] = useState("PEN");
  const url = `${dashboardApi}general?month=${month}&year=${year}&currency=${currency}${projectId ? `&projectId=${projectId}` : ""}`;
  const { data, loading, error, refetch } = useFetch<GeneralDashboardData>(url);
  const matches =
    data &&
    data.period.month === month &&
    data.period.year === year &&
    data.period.currency === currency &&
    data.period.projectId === (projectId || null);
  const ready = matches ? data : null;
  const finances = ready?.finances;
  return (
    <div className="flex min-w-0 flex-col gap-6" aria-busy={loading}>
      <div className="flex flex-col justify-between gap-5 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-slate-50 p-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
            Vista ejecutiva
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            El panorama de tus proyectos
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Economía del período, planillas y pendientes que necesitan atención.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-end gap-3 lg:w-auto">
          <div className="min-w-0 flex-1 lg:w-80">
            <label
              htmlFor="generalProject"
              className="mb-1 block text-xs text-slate-600"
            >
              Proyecto
            </label>
            <Select<number>
              id="generalProject"
              name="generalProject"
              value={projectId}
              onChange={setProjectId}
              className="w-full"
              options={[
                { value: 0, label: "Todos los proyectos" },
                ...(data?.projectOptions ?? []).map((project) => ({
                  value: project.projectId,
                  label: `${project.code} · ${project.name}`,
                })),
              ]}
            />
          </div>
          <div className="w-32">
            <label
              htmlFor="generalCurrency"
              className="mb-1 block text-xs text-slate-600"
            >
              Moneda
            </label>
            <Select
              id="generalCurrency"
              name="generalCurrency"
              value={currency}
              onChange={setCurrency}
              className="w-full"
              options={[
                { value: "PEN", label: "Soles" },
                { value: "USD", label: "Dólares" },
                { value: "EUR", label: "Euros" },
              ]}
            />
          </div>
          <button
            type="button"
            className={`${actionClass} h-11`}
            onClick={refetch}
            disabled={loading}
            title="Actualizar datos"
            aria-label="Actualizar resumen"
          >
            <RefreshCw
              className={`size-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`}
            />
          </button>
        </div>
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"
        >
          <p>No se pudo cargar el resumen: {error}</p>
          <button className={`${actionClass} mt-3`} onClick={refetch}>
            Reintentar
          </button>
        </div>
      ) : !ready ? (
        <div
          role="status"
          className="grid min-h-80 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <span className="sr-only">Cargando dashboard general</span>
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <Metric
              label="Proyectos activos"
              value={String(ready.activeProjects)}
              note="Estado actual · dentro del filtro"
              icon={<BriefcaseBusiness />}
            />
            <Metric
              label="Ingresos registrados"
              value={
                finances ? money(finances.income, currency) : "Restringido"
              }
              note={
                finances
                  ? comparison(finances.income, finances.previous.income)
                  : "Requiere acceso a todas las fuentes económicas"
              }
              icon={finances ? <ArrowDownLeft /> : <LockKeyhole />}
              tone="green"
            />
            <Metric
              label="Gastos registrados"
              value={
                finances ? money(finances.expenses, currency) : "Restringido"
              }
              note={
                finances
                  ? comparison(finances.expenses, finances.previous.expenses)
                  : "El resumen consolidado respeta tus permisos"
              }
              icon={<ArrowUpRight />}
            />
            <Metric
              label="Resultado registrado"
              value={
                finances ? money(finances.result, currency) : "Restringido"
              }
              note="Ingresos menos gastos · no es flujo de caja"
              icon={<TrendingUp />}
              tone={finances && finances.result < 0 ? "red" : "green"}
            />
            <Metric
              label={
                ready.payroll?.projectOnly
                  ? "Planillas · neto base"
                  : "Planillas · neto final"
              }
              value={ready.payroll ? money(ready.payroll.total) : "Restringido"}
              note="PEN · semanas que terminan en el mes"
              icon={<Banknote />}
            />
            <Metric
              label="Pendientes críticos"
              value={String(ready.criticalCount)}
              note="Situación actual · incluye alertas globales"
              icon={<CircleAlert />}
              tone={ready.criticalCount ? "red" : "green"}
            />
          </div>
          {finances ? (
            <>
              <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                <TrendChart rows={finances.trend} currency={currency} />
                <ExpenseChart values={finances} currency={currency} />
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-5 text-slate-600">
                Las órdenes canceladas se excluyen. El gasto incluye{" "}
                {money(finances.pendingPurchases, currency)} en órdenes
                pendientes del mes. Los importes son registrados, no pagos
                confirmados.
                {currency !== "PEN" &&
                  " Planillas y caja chica solo están registradas en PEN; no se convierten ni se suman a esta moneda."}
                {projectId !== 0 &&
                  " Los adicionales generales de planilla no se atribuyen al proyecto."}
              </div>
            </>
          ) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              El consolidado económico se muestra únicamente a usuarios con
              acceso a todas sus fuentes. Los bloques operativos y de planillas
              se habilitan según tus permisos.
            </p>
          )}
          <div className={`grid gap-6 ${finances ? "xl:grid-cols-2" : ""}`}>
            {finances && (
              <ProjectExpenseChart
                projects={ready.projects}
                currency={currency}
              />
            )}
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-blue-700" />
                <h2 className="font-bold text-slate-900">Necesita atención</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Pendientes actuales, independientes del mes consultado.
              </p>
              {ready.alerts.length ? (
                <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
                  {ready.alerts.map((alert) => (
                    <Link
                      key={alert.key}
                      to={alert.href}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600"
                    >
                      <span
                        className={`min-w-9 shrink-0 rounded-lg px-2 py-1.5 text-center text-sm font-bold ${alert.severity === "critical" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}
                      >
                        {alert.count}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {alert.title}
                          {alert.scope === "global" && (
                            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal text-slate-500">
                              Global
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {alert.detail}
                        </p>
                      </div>
                      <ArrowUpRight className="mt-1 size-4 shrink-0 text-slate-400" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="my-8 rounded-xl bg-emerald-50 p-5 text-center text-sm text-emerald-800">
                  No hay alertas detectadas para este filtro.
                </p>
              )}
            </section>
          </div>
          <ProjectTable
            key={`${month}-${year}-${projectId}-${currency}`}
            data={ready}
            currency={currency}
          />
          {ready.payroll && (
            <WeeklyPayroll
              key={`${month}-${year}-${projectId}`}
              payroll={ready.payroll}
            />
          )}
          <div className="flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
            <p>
              Planillas mensuales: se asignan al mes de término de la semana,
              sin duplicar semanas entre meses.
            </p>
            <p>
              Actualizado:{" "}
              {new Date(ready.generatedAt).toLocaleString("es-PE", {
                timeZone: "America/Lima",
              })}{" "}
              · Lima
            </p>
          </div>
        </>
      )}
    </div>
  );
}
