import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { FaSave } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import toast, { Toaster } from "react-hot-toast";
import { useParams } from "react-router-dom";
import Permission from "../common/auth/Permission";
import CalendarButton from "../common/button/CalendarButton";
import { ErrorMessage } from "../common/error";
import { LoadingSkeletonTable } from "../common/loading";
import { Button } from "../components";
import { projectApi, projectWeeklyPayrollApi } from "../data/apiUrl";
import { type Project } from "../data/types";
import { useApiAction, useCurrentUser, useFetch } from "../hooks";
import { adminTypes, formatDate } from "../utils";
import PayrollsTable, {
  type PayrollWeek,
  type ProjectWeeklyPayroll,
} from "./PayrollsTable";

export default function Payrolls() {
  const { user } = useCurrentUser();
  const { id: projectIdParam } = useParams<{ id: string }>();
  const projectId = Number(projectIdParam);

  const { data: project, error: projectError } = useFetch<Project>(
    projectIdParam ? `${projectApi}${projectIdParam}` : "",
    [projectIdParam],
  );
  const {
    data: payrolls,
    loading: payrollsLoading,
    error: payrollsError,
    refetch: refetchPayrolls,
  } = useFetch<ProjectWeeklyPayroll[]>(
    projectIdParam ? `${projectWeeklyPayrollApi}project/${projectIdParam}` : "",
    [projectIdParam],
  );
  const {
    data: weeks,
    loading: weeksLoading,
    error: weeksError,
  } = useFetch<PayrollWeek[]>(
    projectIdParam
      ? `${projectWeeklyPayrollApi}project/${projectIdParam}/weeks`
      : "",
    [projectIdParam],
  );

  const { execute, loading: saving } = useApiAction<ProjectWeeklyPayroll>();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [weekId, setWeekId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const totalRegistered = useMemo(
    () =>
      (payrolls || []).reduce(
        (total, payroll) => total + Number(payroll.amount || 0),
        0,
      ),
    [payrolls],
  );

  const registeredWeekIds = useMemo(
    () => new Set((payrolls || []).map((payroll) => payroll.weekId)),
    [payrolls],
  );

  const selectableWeeks = useMemo(
    () =>
      (weeks || []).filter(
        (week) =>
          !registeredWeekIds.has(week.weekId) || String(week.weekId) === weekId,
      ),
    [registeredWeekIds, weekId, weeks],
  );

  if (!projectIdParam || !Number.isInteger(projectId) || projectId <= 0) {
    return <ErrorMessage errorMessage="No se encontró el proyecto." />;
  }

  const resetForm = () => {
    setEditingId(null);
    setWeekId("");
    setAmount("");
    setNotes("");
  };

  const handleEdit = (payroll: ProjectWeeklyPayroll) => {
    setEditingId(payroll.projectWeeklyPayrollId);
    setWeekId(String(payroll.weekId));
    setAmount(String(Number(payroll.amount)));
    setNotes(payroll.notes || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const numericAmount = Number(amount);
    if (!editingId && !weekId) {
      toast.error("Selecciona una semana.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      toast.error("Ingresa un monto válido mayor o igual a cero.");
      return;
    }

    const request = editingId
      ? execute(`${projectWeeklyPayrollApi}${editingId}`, "PATCH", {
          amount: numericAmount,
          notes,
        })
      : execute(projectWeeklyPayrollApi, "POST", {
          projectId,
          weekId: Number(weekId),
          amount: numericAmount,
          notes,
        });

    await toast.promise(request, {
      loading: editingId
        ? "Actualizando planilla..."
        : "Registrando planilla...",
      success: (response) => response.message,
      error: (error) => error.message || "No se pudo guardar la planilla.",
    });

    resetForm();
    refetchPayrolls();
  };

  const handleDelete = async (payroll: ProjectWeeklyPayroll) => {
    const weekLabel = `${formatDate(payroll.week.startDate)} - ${formatDate(
      payroll.week.endDate,
    )}`;
    if (!window.confirm(`¿Eliminar la planilla de la semana ${weekLabel}?`)) {
      return;
    }

    await toast.promise(
      execute(
        `${projectWeeklyPayrollApi}${payroll.projectWeeklyPayrollId}`,
        "DELETE",
      ),
      {
        loading: "Eliminando planilla...",
        success: (response) => response.message,
        error: (error) => error.message || "No se pudo eliminar la planilla.",
      },
    );

    if (editingId === payroll.projectWeeklyPayrollId) resetForm();
    refetchPayrolls();
  };

  const fetchError = projectError || payrollsError || weeksError;

  return (
    <Permission
      user={user}
      allow={adminTypes}
      fallback={
        <ErrorMessage errorMessage="No tienes permiso para ver esta sección." />
      }
    >
      <Toaster position="top-center" />
      <div className="flex w-full max-w-full flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Planillas semanales
            </h1>
            <p className="text-sm text-gray-600">
              {project?.name || "Proyecto"}: registra el monto total pagado por
              semana.
            </p>
          </div>
          <CalendarButton />
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">
              Semanas registradas
            </p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {payrolls?.length || 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">
              Total registrado
            </p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              S/{" "}
              {totalRegistered.toLocaleString("es-PE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            {editingId
              ? "Editar planilla semanal"
              : "Registrar planilla semanal"}
          </h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Semana
              <select
                value={weekId}
                onChange={(event) => setWeekId(event.target.value)}
                disabled={Boolean(editingId) || weeksLoading || saving}
                required
                className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal outline-none focus:border-blue-600"
              >
                <option value="">Selecciona una semana</option>
                {selectableWeeks.map((week) => (
                  <option key={week.weekId} value={week.weekId}>
                    {formatDate(week.startDate)} - {formatDate(week.endDate)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Monto total (S/)
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={saving}
                required
                placeholder="0.00"
                className="rounded-md border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-600"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Observación (opcional)
              <input
                type="text"
                maxLength={1000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={saving}
                placeholder="Detalle o referencia del pago"
                className="rounded-md border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-600"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            {editingId && (
              <Button
                icon={<FaXmark />}
                label="Cancelar"
                type="button"
                bgColor="#6b7280"
                bgHoverColor="#4b5563"
                onClick={resetForm}
                disabled={saving}
              />
            )}
            <Button
              icon={<FaSave />}
              label={
                saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar"
              }
              type="submit"
              bgColor="#0047a3"
              bgHoverColor="#003366"
              disabled={saving || weeksLoading}
            />
          </div>
        </form>

        {fetchError && <ErrorMessage errorMessage={fetchError} />}
        {payrollsLoading ? (
          <LoadingSkeletonTable />
        ) : payrolls && payrolls.length > 0 ? (
          <PayrollsTable
            payrolls={payrolls}
            disabled={saving}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          !fetchError && (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
              Aún no hay montos de planilla registrados para este proyecto.
            </div>
          )
        )}
      </div>
    </Permission>
  );
}
