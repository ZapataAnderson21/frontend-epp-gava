import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useAccess } from "../../permissions/AccessProvider";
import { listSsomaTalks } from "./ssomaApi";
import { TALK_STATUSES, statusLabel } from "./ssomaRules";
import type { SsomaTalkList, SsomaTalkStatus } from "./ssomaTypes";

const pageSize = 10;

export default function SsomaTalks() {
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SsomaTalkList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const { can } = useAccess();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    listSsomaTalks({
      page,
      pageSize,
      search,
      status: (status || undefined) as SsomaTalkStatus | undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }, controller.signal)
      .then(setResult)
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "No se pudieron cargar las charlas.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, search, status, dateFrom, dateTo, retry]);

  const applySearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchText.trim());
  };

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Seguridad y salud</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Charlas SSOMA</h1>
          <p className="mt-1 text-sm text-slate-600">Gestiona charlas de cinco minutos y revisa su avance.</p>
        </div>
        {can("ssoma.manage") && <Link to="/admin/ssoma/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
          <Plus size={18} aria-hidden="true" /> Nueva charla
        </Link>}
      </header>

      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="Filtros de charlas">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_190px_160px_160px_auto]" onSubmit={applySearch}>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Buscar
            <span className="flex h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 focus-within:ring-2 focus-within:ring-blue-600">
              <Search size={17} className="text-slate-500" aria-hidden="true" />
              <input className="min-w-0 flex-1 outline-none" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Tema o facilitador" maxLength={200} />
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Estado
            <select className="h-11 rounded-lg border border-slate-300 bg-white px-3" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              <option value="">Todos los estados</option>
              {TALK_STATUSES.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Desde<input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-slate-300 px-3" /></label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Hasta<input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-slate-300 px-3" /></label>
          <button className="h-11 self-end rounded-lg border border-blue-700 px-4 font-semibold text-blue-800 hover:bg-blue-50" type="submit">Aplicar</button>
        </form>
      </section>

      {loading && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600" role="status">Cargando charlas…</div>}
      {!loading && error && <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800" role="alert"><p>{error}</p><button type="button" className="mt-3 rounded-lg border border-red-400 px-3 py-2 font-semibold" onClick={() => setRetry((value) => value + 1)}>Reintentar</button></div>}
      {!loading && !error && result?.items.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="font-semibold text-slate-900">No hay charlas para mostrar</h2><p className="mt-1 text-sm text-slate-600">Prueba con otro filtro o crea una nueva charla.</p></div>}

      {!loading && !error && result && result.items.length > 0 && <>
        <div className="grid gap-3 md:hidden">
          {result.items.map((talk) => <article key={talk.ssomaTalkId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3"><h2 className="font-semibold text-slate-900">{talk.topic}</h2><span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">{statusLabel(talk.status)}</span></div>
            <p className="mt-2 text-sm text-slate-600">{talk.project.code} · {talk.project.name}</p>
            <p className="mt-1 text-sm text-slate-600">{new Date(`${talk.talkDate.slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE")} · {talk.trainer || "Facilitador por definir"}</p>
            <Link className="mt-4 inline-flex min-h-10 items-center font-semibold text-blue-700 underline" to={`/admin/ssoma/${talk.ssomaTalkId}`}>Ver charla</Link>
          </article>)}
        </div>
        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Tema</th><th className="px-4 py-3">Proyecto</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3"><span className="sr-only">Acción</span></th></tr></thead>
            <tbody className="divide-y divide-slate-100">{result.items.map((talk) => <tr key={talk.ssomaTalkId}><td className="px-4 py-3 font-semibold text-slate-900">{talk.topic}<span className="block font-normal text-slate-500">{talk.trainer || "Facilitador por definir"}</span></td><td className="px-4 py-3">{talk.project.code} · {talk.project.name}</td><td className="px-4 py-3">{new Date(`${talk.talkDate.slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE")}</td><td className="px-4 py-3">{statusLabel(talk.status)}</td><td className="px-4 py-3 text-right"><Link className="font-semibold text-blue-700 underline" to={`/admin/ssoma/${talk.ssomaTalkId}`}>Abrir</Link></td></tr>)}</tbody>
          </table>
        </div>
        <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginación de charlas">
          <p className="text-sm text-slate-600">{result.pagination.totalItems} resultados · Página {result.pagination.currentPage} de {Math.max(result.pagination.totalPages, 1)}</p>
          <div className="flex gap-2"><button type="button" disabled={!result.pagination.hasPreviousPage} onClick={() => setPage((current) => Math.max(1, current - 1))} className="min-h-10 rounded-lg border border-slate-300 px-3 disabled:opacity-50">Anterior</button><button type="button" disabled={!result.pagination.hasNextPage} onClick={() => setPage((current) => current + 1)} className="min-h-10 rounded-lg border border-slate-300 px-3 disabled:opacity-50">Siguiente</button></div>
        </nav>
      </>}
    </main>
  );
}
