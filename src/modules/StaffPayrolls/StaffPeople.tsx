import { useState } from "react";
import { Pencil, Settings } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Pagination from "../../common/table/Pagination";
import Panel from "../../common/panel/Panel";
import ActionButton from "../../components/ActionButton";
import { staffPayrollApi } from "../../data/apiUrl";
import type { StaffPayrollPerson } from "../../data/types";
import { useApiAction, useDebouncedValue, usePaginatedFetch } from "../../hooks";
import { useAccess } from "../../permissions/AccessProvider";
import StaffPayrollAccess from "./StaffPayrollAccess";
import { formatPen, STAFF_TYPE_LABELS } from "./staffPayrollConfig";

export default function StaffPeople() {
  const { can } = useAccess();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<StaffPayrollPerson | null>(null);
  const [remuneration, setRemuneration] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const {
    items,
    pagination,
    loading,
    error,
    setPage,
    setPageSize,
    refetch,
  } = usePaginatedFetch<StaffPayrollPerson>(staffPayrollApi + "people", {
    params: { search: debouncedSearch },
  });
  const { execute, loading: saving } = useApiAction<unknown>();

  const openProfile = (person: StaffPayrollPerson) => {
    setEditing(person);
    setRemuneration(person.monthlyBaseRemuneration ?? "");
  };

  const saveProfile = async () => {
    if (!editing) return;
    const value = Number(remuneration);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Ingresa una remuneración mensual válida mayor que cero.");
      return;
    }
    await toast.promise(
      execute(
        staffPayrollApi + "people/" + editing.workerId + "/profile",
        "PUT",
        { monthlyBaseRemuneration: value },
      ),
      {
        loading: "Guardando remuneración...",
        success: () => {
          setEditing(null);
          refetch();
          return "Remuneración actualizada.";
        },
        error: (caught) =>
          caught instanceof Error
            ? caught.message
            : "No se pudo guardar la remuneración.",
      },
    );
  };

  return (
    <StaffPayrollAccess>
      <Panel>
        <main className="flex w-full flex-col gap-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0047a3]">
              Planillas mensuales
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-[#0f2545]">
              Personal STAFF
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Ingenieros, administradores y gerentes activos del padrón de
              trabajadores.
            </p>
          </div>
          <a
            href="/admin/workers"
            className="text-sm font-bold text-[#0047a3] hover:underline"
          >
            Ir al padrón de trabajadores
          </a>
        </header>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre o DNI"
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#0047a3]"
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Trabajador</th>
                <th className="px-4 py-3">DNI</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Remuneración mensual</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((person) => (
                <tr key={person.workerId}>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {person.fullName}
                  </td>
                  <td className="px-4 py-3">{person.dni}</td>
                  <td className="px-4 py-3">
                    {STAFF_TYPE_LABELS[person.workerType]}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {person.remunerationConfigured
                      ? formatPen(person.monthlyBaseRemuneration)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        person.remunerationConfigured
                          ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700"
                          : "rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800"
                      }
                    >
                      {person.remunerationConfigured
                        ? "Configurada"
                        : "Remuneración pendiente de configurar"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {can("staffPayroll.manage") && (
                      <ActionButton
                        icon={
                          person.remunerationConfigured ? (
                            <Pencil />
                          ) : (
                            <Settings />
                          )
                        }
                        label={
                          person.remunerationConfigured
                            ? "Editar remuneración"
                            : "Configurar remuneración"
                        }
                        variant="ghost"
                        onClick={() => openProfile(person)}
                      />
                    )}
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No hay personal STAFF que coincida con la búsqueda.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    Cargando personal STAFF...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            disabled={loading}
          />
        )}

        {editing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-profile-title"
          >
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <h2
                id="staff-profile-title"
                className="text-lg font-extrabold text-[#0f2545]"
              >
                Remuneración mensual
              </h2>
              <p className="mt-1 text-sm text-gray-500">{editing.fullName}</p>
              <label className="mt-5 block text-sm font-bold text-gray-700">
                Remuneración base (PEN)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={remuneration}
                  onChange={(event) => setRemuneration(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0047a3]"
                  autoFocus
                />
              </label>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-bold text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void saveProfile()}
                  disabled={saving}
                  className="rounded-lg bg-[#0047a3] px-4 py-2 font-bold text-white disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}
        <Toaster position="top-center" />
        </main>
      </Panel>
    </StaffPayrollAccess>
  );
}
