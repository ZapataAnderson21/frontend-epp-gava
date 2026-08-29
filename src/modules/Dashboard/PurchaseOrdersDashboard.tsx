import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import Select from "../../components/Select";
import { purchaseOrderApi } from "../../data/apiUrl";
import type {
  PurchaseOrderDashboardCurrency,
  PurchaseOrderDashboardOrder,
  PurchaseOrderDashboardRanking,
  PurchaseOrderDashboardResponse,
  PurchaseOrderDashboardStatus,
} from "../../data/types";
import { useFetch } from "../../hooks";

interface PurchaseOrdersDashboardProps {
  month: number;
  year: number;
}

const statusMetadata: Record<
  PurchaseOrderDashboardStatus,
  { label: string; color: string; badge: string }
> = {
  pending: {
    label: "Pendiente",
    color: "#f59e0b",
    badge: "bg-amber-100 text-amber-800",
  },
  authorized: {
    label: "Autorizada",
    color: "#2563eb",
    badge: "bg-blue-100 text-blue-800",
  },
  delivered: {
    label: "Entregada",
    color: "#059669",
    badge: "bg-emerald-100 text-emerald-800",
  },
  cancelled: {
    label: "Cancelada",
    color: "#dc2626",
    badge: "bg-red-100 text-red-800",
  },
};

const currencyLabels: Record<PurchaseOrderDashboardCurrency, string> = {
  PEN: "Soles (PEN)",
  USD: "Dólares (USD)",
  EUR: "Euros (EUR)",
};

export default function PurchaseOrdersDashboard({
  month,
  year,
}: PurchaseOrdersDashboardProps) {
  const navigate = useNavigate();
  const [currency, setCurrency] =
    useState<PurchaseOrderDashboardCurrency>("PEN");
  const [status, setStatus] = useState<PurchaseOrderDashboardStatus | "">("");
  const [projectId, setProjectId] = useState("");
  const [purchaseOrderType, setPurchaseOrderType] = useState("");

  const dashboardUrl = useMemo(() => {
    const params = new URLSearchParams({
      month: String(month),
      year: String(year),
      currency,
    });

    if (status) params.set("status", status);
    if (projectId) params.set("projectId", projectId);
    if (purchaseOrderType) {
      params.set("purchaseOrderType", purchaseOrderType);
    }

    return `${purchaseOrderApi}dashboard?${params.toString()}`;
  }, [currency, month, projectId, purchaseOrderType, status, year]);

  const { data, loading, error } =
    useFetch<PurchaseOrderDashboardResponse>(dashboardUrl);

  const openPurchaseOrder = (purchaseOrder: PurchaseOrderDashboardOrder) => {
    navigate(
      `/admin/projects/${purchaseOrder.projectId}/purchase-orders/${purchaseOrder.purchaseOrderId}`,
    );
  };

  if (loading && !data) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (!data) return null;

  const { totals } = data;

  return (
    <section className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-extrabold">Órdenes de Compra</h2>
        <p className="text-xs font-semibold text-gray-500">
          Seguimiento de compras, autorizaciones, entregas y margen del periodo.
          Los importes no incluyen órdenes canceladas.
        </p>
      </div>

      <div className="grid gap-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        <FilterField label="Moneda">
          <Select<PurchaseOrderDashboardCurrency>
            name="dashboardCurrency"
            value={currency}
            onChange={setCurrency}
            className="text-xs font-semibold"
            options={Object.entries(currencyLabels).map(([value, label]) => ({
              value: value as PurchaseOrderDashboardCurrency,
              label,
            }))}
          />
        </FilterField>

        <FilterField label="Estado">
          <Select<PurchaseOrderDashboardStatus | "">
            name="dashboardStatus"
            value={status}
            onChange={setStatus}
            className="text-xs font-semibold"
            options={[
              { value: "", label: "Todos" },
              ...Object.entries(statusMetadata).map(([value, metadata]) => ({
                value: value as PurchaseOrderDashboardStatus,
                label: metadata.label,
              })),
            ]}
          />
        </FilterField>

        <FilterField label="Proyecto">
          <Select
            name="dashboardProject"
            value={projectId}
            onChange={setProjectId}
            className="text-xs font-semibold"
            options={[
              { value: "", label: "Todos" },
              ...data.filterOptions.projects.map((project) => ({
                value: String(project.projectId),
                label: project.name,
              })),
            ]}
          />
        </FilterField>

        <FilterField label="Tipo">
          <Select
            name="dashboardPurchaseOrderType"
            value={purchaseOrderType}
            onChange={setPurchaseOrderType}
            className="text-xs font-semibold"
            options={[
              { value: "", label: "Todos" },
              { value: "materials", label: "Materiales" },
              { value: "services", label: "Servicios" },
            ]}
          />
        </FilterField>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <DashboardMetricCard
          label="Órdenes del periodo"
          value={String(totals.totalOrders)}
          detail={`${totals.cancelledOrders} cancelada${totals.cancelledOrders === 1 ? "" : "s"}`}
        />
        <DashboardMetricCard
          label="Pendientes"
          value={String(totals.pendingOrders)}
          detail="Requieren autorización"
          tone="amber"
        />
        <DashboardMetricCard
          label="Autorizadas"
          value={String(totals.authorizedOrders)}
          detail="Pendientes de entrega"
          tone="blue"
        />
        <DashboardMetricCard
          label="Entregadas"
          value={String(totals.deliveredOrders)}
          detail="Completadas en el periodo"
          tone="green"
        />
        <DashboardMetricCard
          label="Monto comprado"
          value={formatCurrency(totals.purchaseAmount, currency)}
          detail={`Venta: ${formatCurrency(totals.saleAmount, currency)}`}
        />
        <DashboardMetricCard
          label="Margen estimado"
          value={formatCurrency(totals.margin, currency)}
          detail={`${formatNumber(totals.marginPercent)} % sobre compra`}
          tone={totals.margin >= 0 ? "green" : "red"}
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
        <WeeklyTrendChart data={data.weeklyTrend} currency={currency} />
        <StatusDistribution
          data={data.statusDistribution}
          currency={currency}
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <RankingCard
          title="Compras por proyecto"
          emptyMessage="No hay compras para mostrar por proyecto."
          data={data.topProjects}
          currency={currency}
        />
        <RankingCard
          title="Compras por proveedor"
          emptyMessage="No hay compras para mostrar por proveedor."
          data={data.topSuppliers}
          currency={currency}
        />
      </div>

      <PendingOrdersCard
        data={data.oldestPendingOrders}
        currency={currency}
        onOpen={openPurchaseOrder}
      />

      <LatestOrdersTable
        data={data.latestOrders}
        currency={currency}
        onOpen={openPurchaseOrder}
      />
    </section>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-2xs font-bold uppercase text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function DashboardMetricCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "amber" | "blue" | "green" | "red";
}) {
  const tones = {
    neutral: "border-gray-200",
    amber: "border-amber-300",
    blue: "border-blue-300",
    green: "border-emerald-300",
    red: "border-red-300",
  };

  return (
    <article
      className={`min-w-0 rounded-md border bg-white p-4 shadow-sm ${tones[tone]}`}
    >
      <p className="text-2xs font-bold uppercase text-gray-500">{label}</p>
      <p className="mt-2 break-words text-xl font-extrabold text-gray-900">
        {value}
      </p>
      <p className="mt-1 text-2xs font-semibold text-gray-500">{detail}</p>
    </article>
  );
}

function WeeklyTrendChart({
  data,
  currency,
}: {
  data: PurchaseOrderDashboardResponse["weeklyTrend"];
  currency: PurchaseOrderDashboardCurrency;
}) {
  const maxAmount = Math.max(1, ...data.map((item) => item.purchaseAmount));

  return (
    <article className="min-w-0 rounded-md border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-base font-extrabold">
          Evolución semanal de compras
        </h3>
        <p className="text-2xs font-semibold text-gray-500">
          Monto registrado por semana del mes seleccionado
        </p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex h-72 min-w-[560px] items-end gap-5 border-b border-l border-gray-200 px-6 pb-10 pt-5">
          {data.map((item) => {
            const height =
              item.purchaseAmount > 0
                ? Math.max(5, (item.purchaseAmount / maxAmount) * 100)
                : 0;

            return (
              <div
                key={item.week}
                className="flex h-full min-w-20 flex-1 flex-col items-center justify-end"
              >
                <div className="mb-2 text-center text-2xs font-bold text-gray-600">
                  <span className="block">
                    {formatCompactCurrency(item.purchaseAmount, currency)}
                  </span>
                  <span className="font-semibold text-gray-400">
                    {item.count} OC{item.count === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex h-44 w-full items-end justify-center">
                  <div
                    className="w-12 rounded-t bg-[#146c8d] transition-all hover:bg-[#0047a3]"
                    style={{ height: `${height}%` }}
                    title={formatCurrency(item.purchaseAmount, currency)}
                  />
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs font-extrabold">Semana {item.week}</p>
                  <p className="text-2xs font-semibold text-gray-400">
                    Días {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function StatusDistribution({
  data,
  currency,
}: {
  data: PurchaseOrderDashboardResponse["statusDistribution"];
  currency: PurchaseOrderDashboardCurrency;
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const background = buildDonutBackground(data);

  return (
    <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-extrabold">Distribución por estado</h3>
      <p className="text-2xs font-semibold text-gray-500">
        Cantidad y monto de las órdenes
      </p>

      <div className="my-6 flex justify-center">
        <div
          className="relative flex h-40 w-40 items-center justify-center rounded-full"
          style={{ background }}
          role="img"
          aria-label={`Distribución de ${total} órdenes por estado`}
        >
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
            <span className="text-3xl font-extrabold">{total}</span>
            <span className="text-2xs font-bold uppercase text-gray-500">
              Órdenes
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {data.map((item) => (
          <div
            key={item.status}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: statusMetadata[item.status].color }}
            />
            <div>
              <p className="font-bold">{item.label}</p>
              <p className="text-2xs font-semibold text-gray-400">
                {formatCurrency(item.purchaseAmount, currency)}
              </p>
            </div>
            <span className="font-extrabold">{item.count}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function RankingCard({
  title,
  emptyMessage,
  data,
  currency,
}: {
  title: string;
  emptyMessage: string;
  data: PurchaseOrderDashboardRanking[];
  currency: PurchaseOrderDashboardCurrency;
}) {
  const maximum = Math.max(1, ...data.map((item) => item.purchaseAmount));

  return (
    <article className="min-w-0 rounded-md border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-extrabold">{title}</h3>
      {data.length ? (
        <div className="flex flex-col gap-4">
          {data.map((item, index) => (
            <div key={item.id} className="min-w-0">
              <div className="mb-1.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex min-w-0 gap-2">
                  <span className="font-extrabold text-gray-400">
                    {index + 1}.
                  </span>
                  <span className="truncate font-bold" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="flex-none text-right">
                  <p className="font-extrabold">
                    {formatCurrency(item.purchaseAmount, currency)}
                  </p>
                  <p className="text-2xs font-semibold text-gray-400">
                    {item.count} OC{item.count === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#146c8d]"
                  style={{ width: `${(item.purchaseAmount / maximum) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message={emptyMessage} />
      )}
    </article>
  );
}

function PendingOrdersCard({
  data,
  currency,
  onOpen,
}: {
  data: PurchaseOrderDashboardOrder[];
  currency: PurchaseOrderDashboardCurrency;
  onOpen: (purchaseOrder: PurchaseOrderDashboardOrder) => void;
}) {
  return (
    <article className="min-w-0 rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-5">
        <h3 className="text-base font-extrabold">Pendientes por atender</h3>
        <p className="text-2xs font-semibold text-gray-500">
          Las órdenes pendientes más antiguas del periodo
        </p>
      </div>
      {data.length ? (
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
          {data.map((purchaseOrder) => (
            <button
              key={purchaseOrder.purchaseOrderId}
              type="button"
              onClick={() => onOpen(purchaseOrder)}
              className="min-w-0 rounded-md border border-amber-200 bg-amber-50 p-3 text-left transition hover:border-amber-400 hover:bg-amber-100"
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className="truncate text-xs font-extrabold"
                  title={purchaseOrder.code}
                >
                  {purchaseOrder.code}
                </p>
                <span className="flex-none rounded bg-amber-200 px-2 py-1 text-2xs font-extrabold text-amber-900">
                  {purchaseOrder.daysPending ?? 0} días
                </span>
              </div>
              <p className="mt-2 truncate text-2xs font-bold text-gray-600">
                {purchaseOrder.projectName}
              </p>
              <p className="truncate text-2xs text-gray-500">
                {purchaseOrder.supplierName}
              </p>
              <p className="mt-2 text-xs font-extrabold">
                {formatCurrency(purchaseOrder.purchaseAmount, currency)}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4">
          <EmptyState message="No hay órdenes pendientes con los filtros seleccionados." />
        </div>
      )}
    </article>
  );
}

function LatestOrdersTable({
  data,
  currency,
  onOpen,
}: {
  data: PurchaseOrderDashboardOrder[];
  currency: PurchaseOrderDashboardCurrency;
  onOpen: (purchaseOrder: PurchaseOrderDashboardOrder) => void;
}) {
  return (
    <article className="min-w-0">
      <div className="mb-3">
        <h3 className="text-xl font-extrabold">Últimas órdenes registradas</h3>
        <p className="text-xs font-semibold text-gray-500">
          Detalle de las diez órdenes más recientes del periodo
        </p>
      </div>
      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[1280px] text-left text-xs">
          <thead className="bg-gray-50 text-2xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Proyecto</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Compra</th>
              <th className="px-4 py-3 text-right">Venta</th>
              <th className="px-4 py-3 text-right">Margen</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {data.map((purchaseOrder) => (
              <tr
                key={purchaseOrder.purchaseOrderId}
                className="border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="max-w-52 px-4 py-3 font-bold">
                  <span className="block truncate" title={purchaseOrder.code}>
                    {purchaseOrder.code}
                  </span>
                </td>
                <td className="max-w-48 px-4 py-3">
                  <span
                    className="block truncate"
                    title={purchaseOrder.projectName}
                  >
                    {purchaseOrder.projectName}
                  </span>
                </td>
                <td className="max-w-48 px-4 py-3">
                  <span
                    className="block truncate"
                    title={purchaseOrder.supplierName}
                  >
                    {purchaseOrder.supplierName}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {purchaseOrder.purchaseOrderType === "materials"
                    ? "Materiales"
                    : "Servicios"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  {formatDate(purchaseOrder.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-bold">
                  {formatCurrency(purchaseOrder.purchaseAmount, currency)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {formatCurrency(purchaseOrder.saleAmount, currency)}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-right font-extrabold ${
                    purchaseOrder.margin >= 0
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {formatCurrency(purchaseOrder.margin, currency)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={purchaseOrder.status} />
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onOpen(purchaseOrder)}
                    className="rounded-md bg-[#0047a3] px-3 py-2 text-2xs font-extrabold text-white transition hover:bg-[#00357a]"
                  >
                    Ver orden
                  </button>
                </td>
              </tr>
            ))}
            {!data.length ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  No hay órdenes registradas con los filtros seleccionados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: PurchaseOrderDashboardStatus }) {
  const metadata = statusMetadata[status];
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1.5 text-2xs font-extrabold ${metadata.badge}`}
    >
      {metadata.label}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed border-gray-300 p-5 text-center text-xs font-semibold text-gray-500">
      {message}
    </p>
  );
}

function buildDonutBackground(
  data: PurchaseOrderDashboardResponse["statusDistribution"],
) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (!total) return "#e5e7eb";

  let accumulated = 0;
  const segments = data.map((item) => {
    const start = (accumulated / total) * 100;
    accumulated += item.count;
    const end = (accumulated / total) * 100;
    return `${statusMetadata[item.status].color} ${start}% ${end}%`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

function formatCurrency(
  value: number,
  currency: PurchaseOrderDashboardCurrency,
) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatCompactCurrency(
  value: number,
  currency: PurchaseOrderDashboardCurrency,
) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Lima",
  });
}
