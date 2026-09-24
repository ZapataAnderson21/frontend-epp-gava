import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { purchaseOrderApi } from "../../data/apiUrl";
import { useAccess } from "../../permissions/AccessProvider";
import { useCurrentUser } from "../../hooks/useCurrentUser";

type Order = {
  purchaseOrderId: number;
  code: string;
  status: string;
  project: { name: string };
  supplier: { name: string };
};
type Change = {
  purchaseOrderId: number;
  before: string;
  after: string;
  project: string;
  supplier: string;
  status: string;
};
type Preview = {
  id: string;
  year: number;
  changes: Change[];
  nextNumber: number;
};
type Pending = { preview: Preview; reason: string; attempted: boolean };
type History = {
  items: {
    id: string;
    actorName: string;
    reason: string;
    appliedAt: string;
    plan: { changes: Change[] };
  }[];
  total: number;
};
const api = purchaseOrderApi.replace(
  /purchase-order\/$/,
  "purchase-order-numbering/",
);
class RequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
async function request<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(api + path, {
    method: body ? "POST" : "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok)
    throw new RequestError(
      Array.isArray(json.message)
        ? json.message.join(". ")
        : json.message || "No se pudo completar la solicitud.",
      res.status,
    );
  return json.data as T;
}
const message = (error: unknown) =>
  error instanceof Error ? error.message : "No se pudo completar la solicitud.";
const button = "rounded border px-3 py-2 disabled:opacity-50";
const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  authorized: "Autorizada",
  delivered: "Entregada",
  cancelled: "Cancelada",
};
function Changes({
  changes,
  applied = false,
}: {
  changes: Change[];
  applied?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="p-2">
              {applied ? "Código anterior" : "Código actual"}
            </th>
            <th className="p-2">
              {applied ? "Código nuevo" : "Código propuesto"}
            </th>
            <th className="p-2">Proyecto / proveedor</th>
            <th className="p-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((c) => (
            <tr key={c.purchaseOrderId} className="border-t">
              <td className="p-2 break-words">{c.before}</td>
              <td className="p-2 break-words font-bold">{c.after}</td>
              <td className="p-2">
                {c.project}
                <br />
                {c.supplier}
              </td>
              <td className="p-2">{statusLabels[c.status] || c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default function PurchaseOrderRenumberModal({
  onClose,
  onApplied,
  initialId,
  initialYear,
}: {
  onClose: () => void;
  onApplied: () => void;
  initialId?: number;
  initialYear?: number;
}) {
  const { can } = useAccess();
  const { user } = useCurrentUser();
  const allowed = can("orders.view") && can("orders.renumber");
  const historyAllowed = can("orders.view") && can("orders.renumberHistory");
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const [tab, setTab] = useState<"edit" | "history">(
    allowed ? "edit" : "history",
  );
  const [year, setYear] = useState(initialYear ?? new Date().getFullYear());
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<number[]>(
    initialId ? [initialId] : [],
  );
  const [start, setStart] = useState("");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState<History>({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const key = user ? `gava:renumber:v1:${user.userId}` : null;
  useEffect(() => {
    const d = dialog.current;
    const previous = document.body.style.overflow;
    d?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      d?.close();
      document.body.style.overflow = previous;
    };
  }, []);
  useEffect(() => {
    if (!key) return;
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const value = JSON.parse(stored) as Pending;
        if (value.preview?.id && Array.isArray(value.preview.changes)) {
          setPending(value);
          setYear(value.preview.year);
        }
      }
    } catch {
      setError(
        "No se pudo recuperar el intento anterior. Revisa el historial antes de corregir.",
      );
    }
    setReady(true);
  }, [key]);
  useEffect(() => {
    let active = true;
    setError("");
    setFetching(true);
    const load = async () => {
      try {
        if (tab === "edit" && allowed) {
          const data = await request<Order[]>(`candidates?year=${year}`);
          if (active) setOrders(data);
        } else if (tab === "history" && historyAllowed) {
          const data = await request<History>(
            `history?year=${year}&page=${page}`,
          );
          if (active) setHistory(data);
        }
      } catch (e) {
        if (active) setError(message(e));
      } finally {
        if (active) setFetching(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [year, tab, page, revision, allowed, historyAllowed]);
  function persist(value: Pending | null) {
    if (!key) throw new Error("Espera a que cargue tu sesión.");
    if (value) sessionStorage.setItem(key, JSON.stringify(value));
    else sessionStorage.removeItem(key);
    setPending(value);
  }
  async function preview() {
    if (lock.current || !allowed) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await request<Preview>("preview", {
        year,
        start: Number(start),
        ids: selected,
      });
      persist({ preview: result, reason: "", attempted: false });
    } catch (e) {
      setError(message(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function apply() {
    if (lock.current || !pending || !allowed) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const attempt = {
        ...pending,
        reason: pending.reason.trim(),
        attempted: true,
      };
      persist(attempt);
      await request(`${attempt.preview.id}/apply`, { reason: attempt.reason });
      setSuccess(
        `Corrección aplicada. Próximo correlativo previsto de ${attempt.preview.year}: ${attempt.preview.nextNumber}. Regenera los PDF afectados.`,
      );
      setPending(null);
      try {
        if (key) sessionStorage.removeItem(key);
      } catch {
        /* Server receipt makes a subsequent retry safe. */
      }
      setSelected([]);
      setRevision((v) => v + 1);
      onApplied();
      window.dispatchEvent(new Event("purchase-order-renumbered"));
    } catch (e) {
      setError(message(e));
      if (e instanceof RequestError && [400, 404, 409].includes(e.status)) {
        try {
          persist(null);
        } catch {
          setPending(null);
        }
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function discard() {
    try {
      persist(null);
      setError("");
    } catch (e) {
      setError(message(e));
    }
  }
  const filtered = orders
    .filter((o) =>
      `${o.code} ${o.project.name} ${o.supplier.name}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(b.code.match(/^No\s+(\d+)/)?.[1]) -
        Number(a.code.match(/^No\s+(\d+)/)?.[1]),
    );
  return createPortal(
    <dialog
      ref={dialog}
      aria-labelledby="renumber-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-5xl rounded-xl bg-white p-5 text-gray-900 backdrop:bg-black/50"
    >
      <div className="max-h-[85dvh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <h2 id="renumber-title" className="text-xl font-bold">
            Numeración de órdenes de compra
          </h2>
          <button className={button} disabled={busy} onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="my-4 flex flex-wrap gap-3">
          {allowed && (
            <button
              className={button}
              disabled={busy}
              aria-pressed={tab === "edit"}
              onClick={() => setTab("edit")}
            >
              Corregir numeración
            </button>
          )}
          {historyAllowed && (
            <button
              className={button}
              disabled={busy}
              aria-pressed={tab === "history"}
              onClick={() => setTab("history")}
            >
              Historial de correcciones
            </button>
          )}
          <label>
            Año{" "}
            <input
              className="w-24 rounded border p-2"
              type="number"
              min="2000"
              max="9999"
              value={year}
              disabled={busy || !!pending}
              onChange={(e) => {
                setYear(Number(e.target.value));
                setSelected([]);
                setPage(1);
              }}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="my-3 text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="my-3 text-green-800">
            {success}
          </p>
        )}
        {!allowed && !historyAllowed && (
          <p>No tienes permiso para acceder a esta función.</p>
        )}
        {tab === "edit" &&
          allowed &&
          (pending ? (
            <section>
              <h3 className="font-bold">
                Revisar cambios de {pending.preview.year}
              </h3>
              <Changes changes={pending.preview.changes} />
              <p className="my-3">
                Próximo correlativo previsto:{" "}
                <strong>{pending.preview.nextNumber}</strong>. Se mantienen el
                año, la referencia y el proveedor. Los PDF ya descargados deben
                regenerarse y reemplazarse.
              </p>
              <label className="block">
                Motivo
                <textarea
                  aria-label="Motivo de la corrección"
                  className="mt-1 w-full rounded border p-2"
                  maxLength={500}
                  value={pending.reason}
                  disabled={busy || pending.attempted}
                  onChange={(e) =>
                    setPending({ ...pending, reason: e.target.value })
                  }
                />
              </label>
              <div className="my-3 flex gap-3">
                <button
                  className={`${button} bg-blue-800 text-white`}
                  disabled={busy || !ready || pending.reason.trim().length < 3}
                  onClick={() => void apply()}
                >
                  {busy
                    ? "Aplicando…"
                    : pending.attempted
                      ? "Reintentar el mismo intento"
                      : `Confirmar corrección de ${pending.preview.changes.length} OC`}
                </button>
                {!pending.attempted && (
                  <button className={button} disabled={busy} onClick={discard}>
                    Volver a seleccionar
                  </button>
                )}
              </div>
              {pending.attempted && (
                <p>
                  El intento se conserva. Reintenta para confirmar su resultado
                  sin repetir la operación.
                </p>
              )}
            </section>
          ) : (
            <section>
              <p>
                Selecciona hasta 100 OC del mismo año. Se numerarán según su
                correlativo actual. Solo cambiarán las seleccionadas.
              </p>
              <input
                aria-label="Buscar OC para corregir"
                className="my-3 w-full rounded border p-2"
                placeholder="Buscar código, proyecto o proveedor"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="max-h-80 overflow-auto rounded border">
                {fetching ? (
                  <p className="p-3">Cargando…</p>
                ) : (
                  filtered.map((o) => (
                    <label
                      key={o.purchaseOrderId}
                      className="flex gap-3 border-b p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${o.code}`}
                        checked={selected.includes(o.purchaseOrderId)}
                        disabled={
                          busy ||
                          (!selected.includes(o.purchaseOrderId) &&
                            selected.length >= 100)
                        }
                        onChange={(e) =>
                          setSelected((ids) =>
                            e.target.checked
                              ? [...ids, o.purchaseOrderId]
                              : ids.filter((id) => id !== o.purchaseOrderId),
                          )
                        }
                      />
                      <span>
                        <strong>{o.code}</strong>
                        <br />
                        {o.project.name} · {o.supplier.name}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <div className="my-3 flex flex-wrap items-center gap-3">
                <span>{selected.length} seleccionadas</span>
                <label>
                  Primer número{" "}
                  <input
                    aria-label="Primer número"
                    type="number"
                    min="1"
                    max="999999899"
                    className="w-28 rounded border p-2"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </label>
                <button
                  className={button}
                  disabled={
                    busy ||
                    fetching ||
                    !ready ||
                    !selected.length ||
                    !Number.isInteger(Number(start)) ||
                    Number(start) < 1
                  }
                  onClick={() => void preview()}
                >
                  {busy ? "Preparando…" : "Ver cambios"}
                </button>
              </div>
            </section>
          ))}
        {tab === "history" && historyAllowed && (
          <section>
            {fetching ? (
              <p>Cargando historial…</p>
            ) : (
              history.items.map((item) => (
                <details className="my-3 rounded border p-3" key={item.id}>
                  <summary>
                    {new Date(item.appliedAt).toLocaleString()} ·{" "}
                    {item.actorName} · {item.plan.changes.length} OC
                  </summary>
                  <p className="my-2">Motivo: {item.reason}</p>
                  <Changes changes={item.plan.changes} applied />
                </details>
              ))
            )}
            {!fetching && !history.items.length && (
              <p>No hay correcciones registradas para este año.</p>
            )}
            <div className="flex items-center gap-3">
              <button
                className={button}
                disabled={page <= 1 || fetching}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </button>
              <span>Página {page}</span>
              <button
                className={button}
                disabled={page * 20 >= history.total || fetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          </section>
        )}
      </div>
    </dialog>,
    document.body,
  );
}
