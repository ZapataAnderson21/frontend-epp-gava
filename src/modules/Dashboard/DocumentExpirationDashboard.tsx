import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import Select from "../../components/Select";
import { expiringDocumentsApi } from "../../data/apiUrl";
import type { ExpiringDocumentCategory, ExpiringDocumentDashboardResponse, ExpiringDocumentStatus } from "../../data/types";
import { useFetch } from "../../hooks";

const statusLabels: Record<ExpiringDocumentStatus, string> = { expired: "Vencido", upcoming: "Próximo a vencer", valid: "Vigente" };
const statusStyles: Record<ExpiringDocumentStatus, string> = { expired: "bg-red-100 text-red-700", upcoming: "bg-amber-100 text-amber-700", valid: "bg-emerald-100 text-emerald-700" };

export default function DocumentExpirationDashboard({ month, year }: { month: number; year: number }) {
  const [categoryId, setCategoryId] = useState("");
  const query = new URLSearchParams({ month: String(month), year: String(year) });
  if (categoryId) query.set("categoryId", categoryId);
  const { data, loading, error } = useFetch<ExpiringDocumentDashboardResponse>(`${expiringDocumentsApi}dashboard?${query.toString()}`, [month, year, categoryId]);
  const { data: categories } = useFetch<ExpiringDocumentCategory[]>(`${expiringDocumentsApi}categories`, []);

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">Vencimientos documentales</h2>
          <p className="text-xs font-semibold text-gray-500">Los estados próximos usan el primer aviso configurado en cada categoría.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            name="expirationCategory"
            value={categoryId}
            onChange={setCategoryId}
            className="text-xs"
            options={[
              { value: "", label: "Todas las categorías" },
              ...(categories ?? []).map((category) => ({
                value: String(category.expiringDocumentCategoryId),
                label: category.name,
              })),
            ]}
          />
          <Link to="/admin/document-expirations" className="rounded-lg bg-[#0047a3] px-4 py-2 text-xs font-bold text-white hover:bg-[#00377e]">Administrar documentos</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Vencidos" value={data?.counts.expired ?? 0} tone="text-red-600" />
        <SummaryCard label="Próximos" value={data?.counts.upcoming ?? 0} tone="text-amber-600" />
        <SummaryCard label="Vigentes" value={data?.counts.valid ?? 0} tone="text-emerald-600" />
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="w-full min-w-[960px] text-left text-xs">
          <thead className="bg-gray-50 text-2xs uppercase text-gray-500"><tr><th className="px-4 py-3">Vencimiento</th><th className="px-4 py-3">Documento</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3">Relacionado con</th><th className="px-4 py-3">Almacenamiento</th><th className="px-4 py-3">Estado</th></tr></thead>
          <tbody>
            {(data?.items ?? []).map((document) => (
              <tr key={document.expiringDocumentId} className="border-t border-gray-100">
                <td className="whitespace-nowrap px-4 py-3 font-bold">{formatDate(document.expirationDate)}</td>
                <td className="px-4 py-3"><p className="font-bold">{document.title}</p><p className="text-2xs text-gray-500">{document.documentCode || "Sin código"}</p></td>
                <td className="px-4 py-3">{document.category.name}</td>
                <td className="px-4 py-3"><p className="font-semibold">{document.referenceType}</p><p className="text-2xs text-gray-500">{document.referenceDescription}</p></td>
                <td className="px-4 py-3"><p className="font-semibold">{document.storageSpace}</p><p className="text-2xs text-gray-500">{document.storagePath || document.storageDescription}</p></td>
                <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-2xs font-bold ${statusStyles[document.status]}`}>{statusLabels[document.status]}</span></td>
              </tr>
            ))}
            {!data?.items.length ? <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No hay vencimientos en este periodo.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm"><p className="text-2xs font-bold uppercase text-gray-500">{label}</p><p className={`mt-2 text-3xl font-extrabold ${tone}`}>{value}</p></div>;
}

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}
