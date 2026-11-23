import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Check,
  AlertTriangle,
  Download,
  PackageCheck,
  Plus,
  RotateCcw,
  Save,
  XCircle,
} from "lucide-react";
import ActionButton from "../../components/ActionButton";
import Button from "../../components/Button";
import { ErrorMessage } from "../../common/error";
import { SelectForm } from "../../common/form";
import { HeaderPanel, Panel } from "../../common/panel";
import { Table } from "../../common/table";
import { LoadingSkeletonTable } from "../../common/loading";
import {
  projectApi,
  workerApi,
  workClothingApi,
} from "../../data/apiUrl";
import type {
  Project,
  User,
  Worker,
  WorkClothingCustodyBalance,
  WorkClothingDelivery,
  WorkClothingDispatch,
  WorkClothingStockEntry,
  WorkClothingReturn,
} from "../../data/types";
import { useCurrentUser, useFetch } from "../../hooks";
import { useApiAction } from "../../hooks/useApiAction";
import getAuthHeaders from "../../hooks/getAuthHeaders";
import usePaginatedFetch from "../../hooks/usePaginatedFetch";
import { useAccess } from "../../permissions/AccessProvider";

type Tab = "dispatches" | "custody" | "deliveries";
type QuantityMap = Record<number, string>;
type RequestFulfillment = {
  requestId: number;
  project: Project;
  lines: Array<{
    elementRequestId: number;
    elementId: number;
    elementVariantId: number;
    elementName: string;
    variantLabel: string;
    quantityRequested: number;
    quantityDispatched: number;
    quantityPending: number;
  }>;
};

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-[#0047a3] disabled:bg-gray-100";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

const fullName = (user?: User) =>
  user ? `${user.name} ${user.lastName}`.trim() : "—";

export default function WorkClothing() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(
    searchParams.get("tab") === "custody" ? "custody" : "dispatches",
  );
  const { can } = useAccess();
  return (
    <Panel>
      <HeaderPanel name="ENTREGA DE ROPA DE TRABAJO" />
      <p className="mb-4 text-sm text-gray-500">
        Despachos de Logística, custodia del PDR y entregas a trabajadores.
      </p>
      <div className="mb-5 flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {([
          ["dispatches", "Despachos y recepciones"],
          ["custody", "Custodia y entrega rápida"],
          ["deliveries", "Historial de entregas"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              tab === value
                ? "bg-[#0047a3] text-white"
                : "text-gray-600 hover:bg-blue-50 hover:text-[#0047a3]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="w-full">
        {tab === "dispatches" ? <Dispatches /> : null}
        {tab === "custody" ? <Custody /> : null}
        {tab === "deliveries" ? <Deliveries /> : null}
      </div>
      {!can("workClothing.view") ? (
        <ErrorMessage errorMessage="No cuenta con permiso para consultar este módulo." />
      ) : null}
      <Toaster position="top-center" />
    </Panel>
  );
}

function Dispatches() {
  const { can } = useAccess();
  const [showForm, setShowForm] = useState(false);
  const [projectId, setProjectId] = useState(0);
  const [custodianUserId, setCustodianUserId] = useState(0);
  const [requestId, setRequestId] = useState("");
  const [observations, setObservations] = useState("");
  const [quantities, setQuantities] = useState<QuantityMap>({});
  const { data: projects } = useFetch<Project[]>(`${projectApi}status/active`);
  const { data: custodians } = useFetch<User[]>(`${workClothingApi}custodians`);
  const { data: stock, refetch: refetchStock } =
    useFetch<WorkClothingStockEntry[]>(`${workClothingApi}stock`);
  const { data: fulfillment } = useFetch<RequestFulfillment>(
    requestId ? `${workClothingApi}requests/${requestId}/pending` : "",
    [requestId],
  );
  const {
    items: dispatches,
    pagination,
    setPage,
    setPageSize,
    loading,
    error,
    refetch,
  } = usePaginatedFetch<WorkClothingDispatch>(`${workClothingApi}dispatches`, {
    initialPageSize: 10,
  });
  const { execute, loading: saving } = useApiAction<WorkClothingDispatch>();
  const {
    items: returns,
    pagination: returnPagination,
    setPage: setReturnPage,
    setPageSize: setReturnPageSize,
    refetch: refetchReturns,
  } = usePaginatedFetch<WorkClothingReturn>(`${workClothingApi}returns`, {
    initialPageSize: 5,
  });

  const saveDispatch = async () => {
    const items = Object.entries(quantities)
      .map(([id, quantity]) => {
        const office = stock?.find((entry) => entry.officeInventoryEntryId === Number(id));
        const requestLine = fulfillment?.lines.find(
          (line) =>
            line.elementId === office?.elementId &&
            line.elementVariantId === office?.elementVariantId,
        );
        return {
          officeInventoryEntryId: Number(id),
          elementRequestId: requestLine?.elementRequestId,
          quantity: Number(quantity),
        };
      })
      .filter((item) => item.quantity > 0);
    if (!projectId || !custodianUserId || !items.length) {
      toast.error("Selecciona proyecto, PDR y al menos una prenda con cantidad.");
      return;
    }
    await toast.promise(
      execute(`${workClothingApi}dispatches`, "POST", {
        clientRequestId: crypto.randomUUID(),
        projectId,
        custodianUserId,
        requestId: requestId ? Number(requestId) : undefined,
        dispatchedAt: new Date().toISOString(),
        observations: observations || undefined,
        items,
      }),
      {
        loading: "Registrando despacho...",
        success: "Despacho registrado en tránsito.",
        error: (err) => err.message,
      },
    );
    setQuantities({});
    setObservations("");
    setRequestId("");
    setShowForm(false);
    refetch();
    refetchStock();
  };

  const receive = async (dispatch: WorkClothingDispatch) => {
    await toast.promise(
      execute(`${workClothingApi}dispatches/${dispatch.workClothingDispatchId}/receive`, "POST", {
        items: dispatch.items.map((item) => ({
          dispatchItemId: item.workClothingDispatchItemId,
          quantityReceived: Number(item.quantityDispatched),
        })),
      }),
      {
        loading: "Confirmando recepción...",
        success: "Recepción confirmada.",
        error: (err) => err.message,
      },
    );
    refetch();
  };

  const reportDiscrepancy = async (dispatch: WorkClothingDispatch) => {
    const received = dispatch.items.map((item) => {
      const value = window.prompt(
        `Cantidad física recibida: ${item.elementNameSnapshot} talla ${item.variantLabelSnapshot}`,
        String(Number(item.quantityDispatched)),
      );
      return {
        dispatchItemId: item.workClothingDispatchItemId,
        quantityReceived: value === null ? Number(item.quantityDispatched) : Number(value),
      };
    });
    const notes = window.prompt("Describe la discrepancia encontrada");
    if (!notes?.trim()) return;
    await toast.promise(
      execute(`${workClothingApi}dispatches/${dispatch.workClothingDispatchId}/receive`, "POST", {
        items: received,
        discrepancyNotes: notes.trim(),
      }),
      { loading: "Registrando discrepancia...", success: "Discrepancia registrada sin incorporar saldo.", error: (err) => err.message },
    );
    refetch();
  };

  const confirmReturn = async (item: WorkClothingReturn) => {
    await toast.promise(
      execute(`${workClothingApi}returns/${item.workClothingReturnId}/confirm`, "POST"),
      { loading: "Confirmando devolución...", success: "Stock central actualizado.", error: (err) => err.message },
    );
    refetchReturns();
    refetchStock();
  };

  const columns = [
    { key: "workClothingDispatchId", label: "N.º", width: "5rem" },
    { label: "Fecha", render: (row: WorkClothingDispatch) => formatDate(row.dispatchedAt) },
    { label: "Proyecto", render: (row: WorkClothingDispatch) => row.project?.name || `#${row.projectId}` },
    { label: "PDR", render: (row: WorkClothingDispatch) => fullName(row.custodianUser) },
    {
      label: "Prendas",
      render: (row: WorkClothingDispatch) =>
        row.items.map((item) => `${item.elementNameSnapshot} ${item.variantLabelSnapshot} × ${Number(item.quantityDispatched)}`).join(", "),
    },
    {
      label: "Estado",
      render: (row: WorkClothingDispatch) =>
        row.status === "inTransit" ? "En tránsito" : row.status === "received" ? "Recibido" : "Con discrepancia",
    },
    {
      label: "Acciones",
      render: (row: WorkClothingDispatch) => (
        <div className="flex gap-1">
          {row.status === "inTransit" ? (
            <>
            <ActionButton
              icon={<PackageCheck />}
              label="Confirmar recepción completa"
              onClick={() => void receive(row)}
              variant="ghost"
              permission="workClothing.receive"
              disabled={saving}
            />
            <ActionButton
              icon={<AlertTriangle />}
              label="Registrar discrepancia"
              onClick={() => void reportDiscrepancy(row)}
              variant="ghost"
              tone="danger"
              permission="workClothing.receive"
              disabled={saving}
            />
            </>
          ) : null}
        </div>
      ),
    },
  ] as const;

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  return (
    <div className="space-y-5">
      {can("workClothing.dispatch") ? (
        <div className="flex justify-end">
          <Button
            icon={<Plus />}
            label={showForm ? "Cerrar" : "Nuevo despacho"}
            onClick={() => setShowForm((value) => !value)}
            bgColor="#0047a3"
            bgHoverColor="#00377f"
            type="button"
          />
        </div>
      ) : null}
      {showForm ? (
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <SelectForm
              label="Proyecto"
              name="dispatchProject"
              value={projectId}
              onChange={(value) => setProjectId(Number(value))}
              options={[
                { value: 0, label: "Seleccionar" },
                ...(projects || []).map((project) => ({ value: project.projectId, label: project.name })),
              ]}
            />
            <SelectForm
              label="PDR destinatario"
              name="dispatchCustodian"
              value={custodianUserId}
              onChange={(value) => setCustodianUserId(Number(value))}
              options={[
                { value: 0, label: "Seleccionar" },
                ...(custodians || []).map((user) => ({ value: user.userId, label: fullName(user) })),
              ]}
            />
            <label className="text-sm font-bold text-gray-700">
              Requerimiento de origen (opcional)
              <input className={inputClass} type="number" min={1} value={requestId} onChange={(e) => setRequestId(e.target.value)} />
            </label>
          </div>
          <div className="mt-4 overflow-x-auto">
            {fulfillment ? (
              <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-bold">Avance del requerimiento #{fulfillment.requestId}</p>
                {fulfillment.lines.map((line) => (
                  <p key={line.elementRequestId}>
                    {line.elementName} talla {line.variantLabel}: solicitadas {line.quantityRequested}, despachadas {line.quantityDispatched}, pendientes {line.quantityPending}
                  </p>
                ))}
              </div>
            ) : null}
            <table className="w-full min-w-[620px] text-sm">
              <thead><tr className="border-b text-left"><th className="p-2">Prenda</th><th className="p-2">Talla</th><th className="p-2">Disponible</th><th className="p-2">Despachar</th></tr></thead>
              <tbody>
                {(stock || []).map((item) => (
                  <tr key={item.officeInventoryEntryId} className="border-b">
                    <td className="p-2">{item.element.name}</td>
                    <td className="p-2">{item.elementVariant.label}</td>
                    <td className="p-2">{Number(item.currentStock)}</td>
                    <td className="p-2"><input className="w-28 rounded border px-2 py-1" type="number" min={0} max={Number(item.currentStock)} value={quantities[item.officeInventoryEntryId] || ""} onChange={(e) => setQuantities((current) => ({ ...current, [item.officeInventoryEntryId]: e.target.value }))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="mt-4 block text-sm font-bold text-gray-700">Observaciones<input className={inputClass} value={observations} onChange={(e) => setObservations(e.target.value)} /></label>
          <div className="mt-4 flex justify-end"><Button icon={<Save />} label="Confirmar despacho" onClick={() => void saveDispatch()} bgColor="#0047a3" bgHoverColor="#00377f" type="button" disabled={saving} /></div>
        </section>
      ) : null}
      {dispatches.length ? (
        <Table data={dispatches} columns={columns} pagination={pagination} onPageChange={setPage} onPageSizeChange={setPageSize} />
      ) : (
        <p className="rounded-md border border-dashed p-6 text-center text-gray-500">No hay despachos registrados.</p>
      )}
      {returns.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-800">Devoluciones pendientes hacia Logística</h2>
          <Table
            data={returns}
            pagination={returnPagination}
            onPageChange={setReturnPage}
            onPageSizeChange={setReturnPageSize}
            columns={[
              { label: "Fecha", render: (row: WorkClothingReturn) => formatDate(row.returnedAt) },
              { label: "Proyecto", render: (row: WorkClothingReturn) => row.project.name },
              { label: "PDR", render: (row: WorkClothingReturn) => fullName(row.custodianUser) },
              { label: "Prendas", render: (row: WorkClothingReturn) => row.items.map((entry) => `${entry.elementNameSnapshot} ${entry.variantLabelSnapshot} × ${Number(entry.quantity)}`).join(", ") },
              { label: "Estado", render: (row: WorkClothingReturn) => row.status === "pending" ? "En tránsito" : row.status === "confirmed" ? "Confirmada" : "Cancelada" },
              { label: "Acciones", render: (row: WorkClothingReturn) => row.status === "pending" ? <ActionButton icon={<Check />} label="Confirmar recepción física" onClick={() => void confirmReturn(row)} variant="ghost" permission="workClothing.return" disabled={saving} /> : null },
            ]}
          />
        </section>
      ) : null}
    </div>
  );
}

function Custody() {
  const [searchParams] = useSearchParams();
  const { user } = useCurrentUser();
  const { can } = useAccess();
  const [projectId, setProjectId] = useState(0);
  const [custodianUserId, setCustodianUserId] = useState(0);
  const [workerId, setWorkerId] = useState(Number(searchParams.get("workerId") || 0));
  const [observations, setObservations] = useState("");
  const [quantities, setQuantities] = useState<QuantityMap>({});
  const { data: projects } = useFetch<Project[]>(`${projectApi}status/active`);
  const { data: workers } = useFetch<Worker[]>(workerApi);
  const { data: custodians } = useFetch<User[]>(`${workClothingApi}custodians`);
  useEffect(() => {
    if (user && !custodianUserId) setCustodianUserId(user.userId);
  }, [user, custodianUserId]);
  const custodyUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (projectId) params.set("projectId", String(projectId));
    if (custodianUserId) params.set("custodianUserId", String(custodianUserId));
    return `${workClothingApi}custody?${params}`;
  }, [projectId, custodianUserId]);
  const { data: balances, loading, error, refetch } =
    useFetch<WorkClothingCustodyBalance[]>(custodyUrl, [custodyUrl]);
  const { execute, loading: saving } = useApiAction<unknown>();

  const selected = (balances || []).filter(
    (balance) => Number(quantities[balance.workClothingCustodyBalanceId]) > 0,
  );
  const saveDelivery = async () => {
    if (!projectId || !custodianUserId || !workerId || !selected.length) {
      toast.error("Selecciona proyecto, trabajador y prendas disponibles.");
      return;
    }
    await toast.promise(
      execute(`${workClothingApi}deliveries`, "POST", {
        clientRequestId: crypto.randomUUID(),
        projectId,
        custodianUserId,
        workerId,
        deliveredAt: new Date().toISOString(),
        observations: observations || undefined,
        items: selected.map((balance) => ({
          custodyBalanceId: balance.workClothingCustodyBalanceId,
          quantity: Number(quantities[balance.workClothingCustodyBalanceId]),
        })),
      }),
      { loading: "Guardando entrega...", success: "Entrega registrada.", error: (err) => err.message },
    );
    setQuantities({});
    setObservations("");
    refetch();
  };

  const createReturn = async (balance: WorkClothingCustodyBalance) => {
    const quantity = Number(quantities[balance.workClothingCustodyBalanceId]);
    if (!quantity || quantity <= 0) {
      toast.error("Indica la cantidad a devolver en la fila.");
      return;
    }
    await toast.promise(
      execute(`${workClothingApi}returns`, "POST", {
        clientRequestId: crypto.randomUUID(),
        projectId: balance.projectId,
        custodianUserId: balance.custodianUserId,
        returnedAt: new Date().toISOString(),
        items: [{ custodyBalanceId: balance.workClothingCustodyBalanceId, quantity }],
      }),
      { loading: "Registrando devolución...", success: "Devolución enviada a Logística.", error: (err) => err.message },
    );
    setQuantities((current) => ({ ...current, [balance.workClothingCustodyBalanceId]: "" }));
    refetch();
  };

  const columns = [
    { label: "Proyecto", render: (row: WorkClothingCustodyBalance) => row.project.name },
    { label: "Prenda", render: (row: WorkClothingCustodyBalance) => row.element.name },
    { label: "Talla", render: (row: WorkClothingCustodyBalance) => row.elementVariant.label },
    { label: "Recibidas", render: (row: WorkClothingCustodyBalance) => Number(row.quantityReceived) },
    { label: "Entregadas", render: (row: WorkClothingCustodyBalance) => Number(row.quantityDelivered) },
    { label: "Disponibles", render: (row: WorkClothingCustodyBalance) => Number(row.quantityAvailable) },
    {
      label: "Cantidad",
      render: (row: WorkClothingCustodyBalance) => (
        <input className="w-24 rounded border px-2 py-1" type="number" min={0} max={Number(row.quantityAvailable)} value={quantities[row.workClothingCustodyBalanceId] || ""} onChange={(e) => setQuantities((current) => ({ ...current, [row.workClothingCustodyBalanceId]: e.target.value }))} />
      ),
    },
    {
      label: "Acciones",
      render: (row: WorkClothingCustodyBalance) => can("workClothing.return") ? (
        <ActionButton icon={<RotateCcw />} label="Devolver a Logística" onClick={() => void createReturn(row)} variant="ghost" disabled={saving} />
      ) : null,
    },
  ] as const;

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-3">
        <SelectForm label="Proyecto" name="custodyProject" value={projectId} onChange={(value) => setProjectId(Number(value))} options={[{ value: 0, label: "Todos" }, ...(projects || []).map((project) => ({ value: project.projectId, label: project.name }))]} />
        <SelectForm label="PDR / custodia" name="custodyUser" value={custodianUserId} onChange={(value) => setCustodianUserId(Number(value))} options={[{ value: 0, label: "Mi custodia" }, ...(custodians || []).map((item) => ({ value: item.userId, label: fullName(item) }))]} />
        <SelectForm label="Trabajador" name="deliveryWorker" value={workerId} onChange={(value) => setWorkerId(Number(value))} options={[{ value: 0, label: "Seleccionar" }, ...(workers || []).map((worker) => ({ value: worker.workerId, label: `${worker.fullName} — ${worker.dni}` }))]} />
      </div>
      <label className="block text-sm font-bold text-gray-700">Observaciones de la entrega<input className={inputClass} value={observations} onChange={(e) => setObservations(e.target.value)} /></label>
      {(balances || []).length ? <Table data={balances || []} columns={columns} enablePagination={false} /> : <p className="rounded-md border border-dashed p-6 text-center text-gray-500">No hay ropa disponible en la custodia seleccionada.</p>}
      {can("workClothing.deliver") ? <div className="flex justify-end"><Button icon={<Check />} label="Registrar entrega" onClick={() => void saveDelivery()} bgColor="#0047a3" bgHoverColor="#00377f" type="button" disabled={saving} /></div> : null}
    </div>
  );
}

function Deliveries() {
  const [search, setSearch] = useState("");
  const { can } = useAccess();
  const { items, pagination, setPage, setPageSize, loading, error, refetch } =
    usePaginatedFetch<WorkClothingDelivery>(`${workClothingApi}deliveries`, {
      params: { search: search.trim() || undefined, order: "desc" },
      extraDeps: [search],
    });
  const { execute, loading: changing } = useApiAction<unknown>();

  const downloadPdf = async (delivery: WorkClothingDelivery) => {
    const response = await fetch(`${workClothingApi}deliveries/${delivery.workClothingDeliveryId}/pdf`, {
      headers: getAuthHeaders(),
      credentials: "include",
    });
    if (!response.ok) throw new Error("No se pudo descargar la constancia.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `entrega-ropa-ER-${String(delivery.workClothingDeliveryId).padStart(6, "0")}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const annul = async (delivery: WorkClothingDelivery) => {
    const reason = window.prompt("Motivo de anulación");
    if (!reason?.trim()) return;
    await toast.promise(
      execute(`${workClothingApi}deliveries/${delivery.workClothingDeliveryId}/annul`, "PATCH", { reason: reason.trim() }),
      { loading: "Anulando entrega...", success: "Entrega anulada y saldo restituido.", error: (err) => err.message },
    );
    refetch();
  };

  const columns = [
    { label: "N.º", render: (row: WorkClothingDelivery) => `ER-${String(row.workClothingDeliveryId).padStart(6, "0")}` },
    { label: "Fecha", render: (row: WorkClothingDelivery) => formatDate(row.deliveredAt) },
    { label: "Trabajador", render: (row: WorkClothingDelivery) => `${row.worker.fullName} — ${row.worker.dni}` },
    { label: "Proyecto", render: (row: WorkClothingDelivery) => row.project.name },
    { label: "PDR", render: (row: WorkClothingDelivery) => fullName(row.custodianUser) },
    { label: "Prendas", render: (row: WorkClothingDelivery) => row.items.map((item) => `${item.elementNameSnapshot} ${item.variantLabelSnapshot} × ${Number(item.quantity)}`).join(", ") },
    { label: "Estado", render: (row: WorkClothingDelivery) => row.status === "registered" ? "Registrada" : "Anulada" },
    {
      label: "Acciones",
      render: (row: WorkClothingDelivery) => (
        <div className="flex gap-1">
          <ActionButton icon={<Download />} label="Descargar constancia PDF" onClick={() => void downloadPdf(row).catch((error) => toast.error(error.message))} variant="ghost" permission="workClothing.export" />
          {row.status === "registered" ? <ActionButton icon={<XCircle />} label="Anular entrega" onClick={() => void annul(row)} variant="ghost" tone="danger" permission="workClothing.cancel" disabled={changing} /> : null}
        </div>
      ),
    },
  ] as const;
  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  return (
    <div className="space-y-4">
      <input type="search" className={`${inputClass} max-w-lg`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por trabajador, DNI o proyecto" aria-label="Buscar entregas de ropa" />
      {items.length ? <Table data={items} columns={columns} pagination={pagination} onPageChange={setPage} onPageSizeChange={setPageSize} /> : <p className="rounded-md border border-dashed p-6 text-center text-gray-500">No hay entregas registradas.</p>}
      {!can("workClothing.export") ? <p className="text-xs text-gray-500">La descarga de constancias requiere permiso de exportación.</p> : null}
    </div>
  );
}
