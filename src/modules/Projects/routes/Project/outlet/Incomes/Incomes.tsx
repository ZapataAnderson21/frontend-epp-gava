import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useParams } from "react-router-dom";
import Permission from "../../../../../../common/auth/Permission";
import { ErrorMessage } from "../../../../../../common/error";
import Table, { type Column } from "../../../../../../common/table/Table";
import { serviceSaleApi } from "../../../../../../data/apiUrl";
import type { Currency, ServiceSaleType } from "../../../../../../data/types";
import {
  useApiAction,
  useCurrentUser,
  usePaginatedFetch,
} from "../../../../../../hooks";
import { adminTypes } from "../../../../../../utils";

const CURRENCIES: Array<{ value: Currency; label: string }> = [
  { value: "PEN", label: "Soles (PEN)" },
  { value: "USD", label: "Dólares (USD)" },
  { value: "EUR", label: "Euros (EUR)" },
];

const SYMBOLS: Record<Currency, string> = { PEN: "S/.", USD: "$", EUR: "€" };

interface IncomeDraft {
  serviceName: string;
  description: string;
  amount: string;
  currency: Currency;
}

const EMPTY_DRAFT: IncomeDraft = {
  serviceName: "",
  description: "",
  amount: "",
  currency: "PEN",
};

export default function Incomes() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { user } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState<Currency | "">("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState<ServiceSaleType | null>(null);
  const [draft, setDraft] = useState<IncomeDraft>(EMPTY_DRAFT);
  const [modalOpen, setModalOpen] = useState(false);
  const { execute, loading: saving } = useApiAction<ServiceSaleType>();

  const queryParams = useMemo(
    () => ({ search, currency }),
    [currency, search],
  );
  const {
    items,
    pagination,
    loading,
    error,
    setPage,
    setPageSize,
  } = usePaginatedFetch<ServiceSaleType>(
    `${serviceSaleApi}project/${projectId}/paginated`,
    {
      params: queryParams,
      enabled: Number.isInteger(projectId) && projectId > 0,
      extraDeps: [refreshKey],
    },
  );

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return <ErrorMessage errorMessage="No se encontró el proyecto." />;
  }

  const openCreate = () => {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setModalOpen(true);
  };

  const openEdit = (income: ServiceSaleType) => {
    setEditing(income);
    setDraft({
      serviceName: income.serviceName,
      description: income.description,
      amount: String(income.amount),
      currency: income.currency,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setDraft(EMPTY_DRAFT);
  };

  const saveIncome = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(draft.amount);
    if (!draft.serviceName.trim() || !draft.description.trim() || amount <= 0) {
      toast.error("Completa nombre, descripción y un monto mayor que cero.");
      return;
    }

    const payload = {
      projectId,
      serviceName: draft.serviceName.trim(),
      description: draft.description.trim(),
      amount,
      currency: draft.currency,
    };
    const action = editing
      ? execute(`${serviceSaleApi}${editing.serviceSaleId}`, "PATCH", payload)
      : execute(serviceSaleApi, "POST", payload);

    try {
      const result = await action;
      toast.success(result.message);
      closeModal();
      setRefreshKey((value) => value + 1);
    } catch (caught: unknown) {
      toast.error(caught instanceof Error ? caught.message : "No se pudo guardar el ingreso.");
    }
  };

  const removeIncome = async (income: ServiceSaleType) => {
    if (!window.confirm(`¿Eliminar el ingreso “${income.serviceName}”?`)) return;
    try {
      const result = await execute(
        `${serviceSaleApi}${income.serviceSaleId}`,
        "DELETE",
      );
      toast.success(result.message);
      setRefreshKey((value) => value + 1);
    } catch (caught: unknown) {
      toast.error(caught instanceof Error ? caught.message : "No se pudo eliminar el ingreso.");
    }
  };

  const columns: readonly Column<ServiceSaleType>[] = [
    { key: "serviceName", label: "Nombre", width: "25%" },
    { key: "description", label: "Descripción", width: "35%", truncate: true },
    {
      key: "amount",
      label: "Monto",
      align: "right",
      render: (income) =>
        `${SYMBOLS[income.currency]} ${Number(income.amount).toLocaleString("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    { key: "currency", label: "Moneda", align: "center" },
    {
      label: "Acciones",
      align: "center",
      render: (income) => (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => openEdit(income)}
            className="rounded-md bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
            aria-label={`Editar ${income.serviceName}`}
          >
            <Pencil size={17} />
          </button>
          <button
            type="button"
            onClick={() => void removeIncome(income)}
            className="rounded-md bg-red-50 p-2 text-red-700 hover:bg-red-100"
            aria-label={`Eliminar ${income.serviceName}`}
          >
            <Trash2 size={17} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Permission
      user={user}
      allow={adminTypes}
      fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta sección." />}
    >
      <Toaster position="top-center" />
      <section className="flex w-full flex-col gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Ingresos registrados</h2>
            <p className="text-sm text-gray-500">
              Registra ingresos adicionales que formarán parte del resumen económico del proyecto.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#0047a3] px-4 py-2.5 font-semibold text-white hover:bg-[#00377f]"
          >
            <Plus size={18} /> Nuevo ingreso
          </button>
        </div>

        <div className="grid gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-[1fr_240px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o descripción"
            className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0047a3]"
          />
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value as Currency | "")}
            className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0047a3]"
          >
            <option value="">Todas las monedas</option>
            {CURRENCIES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {error ? <ErrorMessage errorMessage={error} /> : null}
        <Table<ServiceSaleType>
          data={items}
          columns={columns}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={loading}
          getRowKey={(income) => income.serviceSaleId}
        />

        {modalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form
              onSubmit={(event) => void saveIncome(event)}
              className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {editing ? "Editar ingreso" : "Nuevo ingreso"}
                </h3>
                <button type="button" onClick={closeModal} aria-label="Cerrar">
                  <X className="text-gray-500" />
                </button>
              </div>
              <div className="grid gap-4">
                <label className="grid gap-1 text-sm font-semibold">
                  Nombre
                  <input
                    required
                    maxLength={150}
                    value={draft.serviceName}
                    onChange={(event) => setDraft((value) => ({ ...value, serviceName: event.target.value }))}
                    className="rounded-lg border border-gray-300 px-3 py-2 font-normal"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Descripción
                  <textarea
                    required
                    rows={4}
                    value={draft.description}
                    onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))}
                    className="resize-y rounded-lg border border-gray-300 px-3 py-2 font-normal"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm font-semibold">
                    Monto
                    <input
                      required
                      min="0.01"
                      step="0.01"
                      type="number"
                      value={draft.amount}
                      onChange={(event) => setDraft((value) => ({ ...value, amount: event.target.value }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold">
                    Moneda
                    <select
                      value={draft.currency}
                      onChange={(event) => setDraft((value) => ({ ...value, currency: event.target.value as Currency }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 font-normal"
                    >
                      {CURRENCIES.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="rounded-lg border px-4 py-2">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#0047a3] px-4 py-2 font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </section>
    </Permission>
  );
}
