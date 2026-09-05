import { Link } from "react-router-dom";
import type { Amounts, GeneralDashboardData } from "./types";
import { money, monthName } from "./format";

export function TrendChart({
  rows,
  currency,
}: {
  rows: (Amounts & { month: string })[];
  currency: string;
}) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.income, row.expenses]));
  const min = Math.min(0, ...rows.flatMap((row) => [row.income, row.expenses]));
  const x = (index: number) => 75 + index * 100;
  const y = (value: number) => 205 - ((value - min) / (max - min)) * 170;
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">Ingresos y gastos</h2>
          <p className="mt-1 text-xs text-slate-500">
            Últimos seis meses · {currency}
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="text-emerald-700">● Ingresos</span>
          <span className="text-blue-700">● Gastos</span>
        </div>
      </div>
      {rows.some((row) => row.income !== 0 || row.expenses !== 0) ? (
        <svg
          viewBox="0 0 635 245"
          role="img"
          aria-label="Evolución de ingresos y gastos registrados. Valores exactos en Ver datos del gráfico."
          className="mt-4 w-full"
        >
          {[0, 0.5, 1].map((ratio) => {
            const value = min + ratio * (max - min);
            return (
              <g key={ratio}>
                <line
                  x1="75"
                  x2="575"
                  y1={y(value)}
                  y2={y(value)}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x="65"
                  y={y(value) + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                >
                  {new Intl.NumberFormat("es-PE", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(value)}
                </text>
              </g>
            );
          })}
          {(["income", "expenses"] as const).map((field) => (
            <g key={field}>
              <polyline
                points={rows
                  .map((row, index) => `${x(index)},${y(row[field])}`)
                  .join(" ")}
                fill="none"
                stroke={field === "income" ? "#059669" : "#2563eb"}
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {rows.map((row, index) => (
                <circle
                  key={row.month}
                  cx={x(index)}
                  cy={y(row[field])}
                  r="4"
                  fill="white"
                  stroke={field === "income" ? "#059669" : "#2563eb"}
                  strokeWidth="2"
                >
                  <title>
                    {monthName(row.month)}: {money(row[field], currency)}
                  </title>
                </circle>
              ))}
            </g>
          ))}
          {rows.map((row, index) => (
            <text
              key={row.month}
              x={x(index)}
              y="232"
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              {monthName(row.month)}
            </text>
          ))}
        </svg>
      ) : (
        <p className="flex min-h-56 items-center justify-center text-sm text-slate-500">
          No hay movimientos económicos en estos meses.
        </p>
      )}
      <details className="mt-2 text-xs text-slate-600">
        <summary className="cursor-pointer py-2">Ver datos del gráfico</summary>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className="py-2 text-left">Mes</th>
                <th>Ingresos</th>
                <th>Gastos</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.month}>
                  <td className="py-2 text-left">{monthName(row.month)}</td>
                  <td>{money(row.income, currency)}</td>
                  <td>{money(row.expenses, currency)}</td>
                  <td>{money(row.result, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function ExpenseChart({
  values,
  currency,
}: {
  values: Amounts;
  currency: string;
}) {
  const categories = [
    { label: "Materiales", value: values.materials, color: "bg-blue-600" },
    { label: "Servicios", value: values.services, color: "bg-indigo-500" },
    {
      label: "Planillas · neto base",
      value: values.payroll,
      color: "bg-cyan-600",
    },
    { label: "Caja chica", value: values.pettyCash, color: "bg-amber-500" },
    {
      label: "Adicionales generales",
      value: values.adjustments,
      color: "bg-violet-500",
    },
  ];
  const max = Math.max(
    1,
    ...categories.map((category) => Math.abs(category.value)),
  );
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-900">¿En qué se está gastando?</h2>
      <p className="mt-1 text-xs text-slate-500">
        Composición del período · {currency}
      </p>
      <div className="mt-6 space-y-5">
        {categories.map((category) => (
          <div key={category.label}>
            <div className="mb-2 flex flex-wrap justify-between gap-1 text-xs">
              <span className="text-slate-600">{category.label}</span>
              <span className="font-semibold tabular-nums">
                {money(category.value, currency)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${category.color}`}
                style={{ width: `${(Math.abs(category.value) / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProjectExpenseChart({
  projects,
  currency,
}: {
  projects: GeneralDashboardData["projects"];
  currency: string;
}) {
  const rows = projects
    .filter((project) => project.finances && project.finances.expenses !== 0)
    .sort((a, b) => (b.finances?.expenses ?? 0) - (a.finances?.expenses ?? 0))
    .slice(0, 5);
  const max = Math.max(
    1,
    ...rows.map((row) => Math.abs(row.finances!.expenses)),
  );
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-900">Gasto por proyecto</h2>
      <p className="mt-1 text-xs text-slate-500">
        Los cinco mayores importes · sin adicionales generales
      </p>
      {rows.length ? (
        <div className="mt-5 space-y-4">
          {rows.map((row) => (
            <Link
              to={`/admin/projects/${row.projectId}`}
              key={row.projectId}
              className="block rounded-lg p-2 -mx-2 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <div className="mb-2 flex justify-between gap-3 text-xs">
                <span
                  className="min-w-0 truncate font-semibold"
                  title={row.name}
                >
                  {row.code} · {row.name}
                </span>
                <span className="shrink-0 tabular-nums">
                  {money(row.finances!.expenses, currency)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${(Math.abs(row.finances!.expenses) / max) * 100}%`,
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-slate-500">
          Sin gastos por proyecto en el período.
        </p>
      )}
    </section>
  );
}
