import { FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReturnButton from "../../common/button/ReturnButton";
import ButtonSubmit from "../../common/form/ButtonSubmit";
import Panel from "../../common/panel/Panel";
import { staffPayrollApi } from "../../data/apiUrl";
import type {
  SaveStaffPayrollPayload,
  StaffPayrollDetail,
  StaffPayrollPreparation,
  StaffPayrollPreparationRow,
} from "../../data/types";
import { useApiAction, useFetch } from "../../hooks";
import { useAccess } from "../../permissions/AccessProvider";
import StaffPayrollAccess from "./StaffPayrollAccess";
import { downloadStaffPayroll } from "./downloadStaffPayroll";
import {
  formatPen,
  periodLabel,
  STAFF_TYPE_LABELS,
} from "./staffPayrollConfig";

interface StaffPayrollEditorProps {
  mode: "new" | "existing";
}

interface PayrollRowDraft extends StaffPayrollPreparationRow {
  baseRemuneration: string;
  additionalIncome: string;
  manualDiscounts: string;
  observations: string;
  updateProfile: boolean;
  notesOpen: boolean;
}

const currentPeriodValue = () => {
  const date = new Date();
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0")
  );
};

const rowsSignature = (rows: PayrollRowDraft[]) =>
  JSON.stringify(
    rows.map(
      ({
        workerId,
        included,
        baseRemuneration,
        additionalIncome,
        manualDiscounts,
        observations,
        updateProfile,
      }) => ({
        workerId,
        included,
        baseRemuneration,
        additionalIncome,
        manualDiscounts,
        observations,
        updateProfile,
      }),
    ),
  );

const validMoney = (value: string, allowZero: boolean) => {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return false;
  const amount = Number(normalized);
  return Number.isFinite(amount) && (allowZero ? amount >= 0 : amount > 0);
};

export default function StaffPayrollEditor({
  mode,
}: StaffPayrollEditorProps) {
  const params = useParams();
  const navigate = useNavigate();
  const { can } = useAccess();
  const [periodValue, setPeriodValue] = useState(
    mode === "existing"
      ? params.year + "-" + String(params.month).padStart(2, "0")
      : currentPeriodValue(),
  );
  const [rows, setRows] = useState<PayrollRowDraft[]>([]);
  const [baseline, setBaseline] = useState("");
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [exporting, setExporting] = useState(false);
  const [year, month] = periodValue.split("-").map(Number);
  const validPeriod =
    Number.isInteger(year) &&
    year >= 1900 &&
    year <= 9999 &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12;
  const prepareUrl = validPeriod
    ? staffPayrollApi +
      "periods/prepare?year=" +
      year +
      "&month=" +
      month
    : "";
  const { data, loading, error, refetch } =
    useFetch<StaffPayrollPreparation>(prepareUrl);
  const { execute, loading: saving } = useApiAction<StaffPayrollDetail>();
  const dirty = baseline !== "" && rowsSignature(rows) !== baseline;
  const duplicatePeriod = mode === "new" && Boolean(data?.exists);
  const editable = can("staffPayroll.manage") && !duplicatePeriod;

  useEffect(() => {
    if (!data || data.year !== year || data.month !== month) return;
    const preparedRows: PayrollRowDraft[] = data.rows.map((row) => ({
      ...row,
      baseRemuneration: row.baseRemuneration ?? "",
      additionalIncome: row.additionalIncome ?? "0.00",
      manualDiscounts: row.manualDiscounts ?? "0.00",
      observations: row.observations ?? "",
      updateProfile: false,
      notesOpen: false,
    }));
    setRows(preparedRows);
    setBaseline(rowsSignature(preparedRows));
    setRowErrors({});
  }, [data, month, year]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  const totals = useMemo(
    () =>
      rows
        .filter((row) => row.included)
        .reduce(
          (sum, row) => {
            const base = Number(row.baseRemuneration) || 0;
            const additional = Number(row.additionalIncome) || 0;
            const discounts = Number(row.manualDiscounts) || 0;
            return {
              base: sum.base + base,
              additional: sum.additional + additional,
              discounts: sum.discounts + discounts,
              net: sum.net + base + additional - discounts,
            };
          },
          { base: 0, additional: 0, discounts: 0, net: 0 },
        ),
    [rows],
  );

  const updateRow = (
    workerId: number,
    changes: Partial<PayrollRowDraft>,
  ) => {
    setRows((current) =>
      current.map((row) =>
        row.workerId === workerId ? { ...row, ...changes } : row,
      ),
    );
    setRowErrors((current) => {
      if (!current[workerId]) return current;
      const next = { ...current };
      delete next[workerId];
      return next;
    });
  };

  const confirmDiscard = () =>
    !dirty ||
    window.confirm(
      "Hay cambios sin guardar. ¿Deseas descartarlos y continuar?",
    );

  const changePeriod = (value: string) => {
    if (!confirmDiscard()) return;
    setRows([]);
    setBaseline("");
    setPeriodValue(value);
  };

  const goBack = () => {
    if (confirmDiscard()) navigate("/admin/staff-payroll");
  };

  const validateRows = () => {
    const errors: Record<number, string> = {};
    const selectedRows = rows.filter((row) => row.included);
    if (!selectedRows.length) {
      toast.error("Incluye al menos un trabajador en la planilla.");
      return null;
    }
    selectedRows.forEach((row) => {
      if (!validMoney(row.baseRemuneration, false)) {
        errors[row.workerId] =
          "Ingresa un sueldo base válido mayor que cero y con hasta dos decimales.";
        return;
      }
      if (
        !validMoney(row.additionalIncome || "0", true) ||
        !validMoney(row.manualDiscounts || "0", true)
      ) {
        errors[row.workerId] =
          "Los adicionales y descuentos deben ser importes no negativos con hasta dos decimales.";
        return;
      }
      const gross =
        Number(row.baseRemuneration) + Number(row.additionalIncome || 0);
      const manualDiscounts = Number(row.manualDiscounts || 0);
      if (manualDiscounts > gross) {
        errors[row.workerId] =
          "Los descuentos no pueden superar el importe bruto.";
      }
    });
    setRowErrors(errors);
    if (Object.keys(errors).length) {
      toast.error("Corrige las filas marcadas antes de guardar.");
      return null;
    }
    return selectedRows;
  };

  const savePayroll = async (event: React.FormEvent) => {
    event.preventDefault();
    const selectedRows = validateRows();
    if (!selectedRows) return;
    const payload: SaveStaffPayrollPayload = {
      year,
      month,
      expectExisting: mode === "existing" || Boolean(data?.exists),
      rows: rows.map((row) => ({
        workerId: row.workerId,
        included: row.included,
        ...(row.included
          ? { baseRemuneration: Number(row.baseRemuneration) }
          : {}),
        additionalIncome: Number(row.additionalIncome || 0),
        manualDiscounts: Number(row.manualDiscounts || 0),
        observations: row.observations.trim() || null,
        updateProfile: row.updateProfile,
      })),
    };
    await toast.promise(execute(staffPayrollApi + "periods", "PUT", payload), {
      loading: "Guardando planilla...",
      success: () => {
        setBaseline(rowsSignature(rows));
        setRowErrors({});
        if (mode === "new") {
          navigate("/admin/staff-payroll/" + year + "/" + month, {
            replace: true,
          });
        } else {
          refetch();
        }
        return "Planilla guardada correctamente.";
      },
      error: (caught) =>
        caught instanceof Error
          ? caught.message
          : "No se pudo guardar la planilla.",
    });
  };

  const exportPeriod = async () => {
    setExporting(true);
    try {
      await downloadStaffPayroll(year, month);
      toast.success("Archivo Excel generado.");
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "No se pudo exportar.",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <StaffPayrollAccess>
      <Panel>
        <form
          onSubmit={(event) => void savePayroll(event)}
          className="flex w-full min-w-0 flex-col gap-6"
        >
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-[#0f2545]">
                Planilla STAFF —{" "}
                {validPeriod ? periodLabel(year, month) : "Nuevo período"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Edita las remuneraciones del período y guarda todas las filas
                en una sola acción.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {data?.exists && can("staffPayroll.export") && (
                <button
                  type="button"
                  onClick={() => void exportPeriod()}
                  disabled={exporting}
                  className="rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-50"
                >
                  {exporting ? "Exportando..." : "Exportar Excel"}
                </button>
              )}
              <ReturnButton onClick={goBack} disabled={saving} />
            </div>
          </header>

          {mode === "new" && (
            <label className="flex w-full max-w-xs flex-col gap-2 text-sm font-bold text-slate-700">
              Mes y año
              <input
                type="month"
                value={periodValue}
                onChange={(event) => changePeriod(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[#0047a3]"
              />
            </label>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {duplicatePeriod && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
              Ya existe una planilla para este período. No se creará ni
              sobrescribirá desde el flujo de alta.{" "}
              <Link
                to={"/admin/staff-payroll/" + year + "/" + month}
                className="font-bold underline"
              >
                Abrir planilla existente
              </Link>
            </div>
          )}

          {loading && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              Cargando personal STAFF...
            </div>
          )}

          {!loading && data && rows.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="font-semibold text-slate-700">
                No existen trabajadores STAFF elegibles.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Registra o actualiza el tipo de trabajador en el padrón.
              </p>
              <Link
                to="/admin/workers"
                className="mt-3 inline-block font-bold text-[#0047a3] hover:underline"
              >
                Ir al padrón de Trabajadores
              </Link>
            </div>
          )}

          {!loading && rows.length > 0 && (
            <section className="w-full min-w-0 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-gray-100 font-semibold text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Trabajador</th>
                    <th className="px-4 py-3 text-right">Sueldo base</th>
                    <th className="px-4 py-3 text-right">
                      Ingresos adicionales
                    </th>
                    <th className="px-4 py-3 text-right">Descuentos</th>
                    <th className="px-4 py-3 text-right">Total neto</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const base = Number(row.baseRemuneration) || 0;
                    const additional = Number(row.additionalIncome) || 0;
                    const discounts = Number(row.manualDiscounts) || 0;
                    const net = base + additional - discounts;
                    const rowDisabled = !editable || !row.included;
                    return (
                      <tr
                        key={row.workerId}
                        className={
                          "border-t border-gray-100 align-top " +
                          (rowErrors[row.workerId]
                            ? "bg-red-50"
                            : row.included
                              ? "bg-white"
                              : "bg-gray-50 text-gray-500")
                        }
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              aria-label={
                                "Incluir a " + row.workerNameSnapshot
                              }
                              checked={row.included}
                              disabled={!editable || row.persisted}
                              onChange={(event) =>
                                updateRow(row.workerId, {
                                  included: event.target.checked,
                                })
                              }
                              className="mt-1"
                            />
                            <div>
                              <p className="font-bold text-slate-800">
                                {row.workerNameSnapshot}
                              </p>
                              <p className="text-xs text-gray-500">
                                {STAFF_TYPE_LABELS[row.workerTypeSnapshot] ??
                                  row.workerTypeSnapshot}
                                {" · DNI "}
                                {row.workerDniSnapshot}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  updateRow(row.workerId, {
                                    notesOpen: !row.notesOpen,
                                  })
                                }
                                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#0047a3] hover:underline"
                              >
                                <FileText size={15} />
                                {row.observations
                                  ? "Editar observación"
                                  : "Añadir observación"}
                              </button>
                              {row.notesOpen && (
                                <textarea
                                  value={row.observations}
                                  disabled={rowDisabled}
                                  onChange={(event) =>
                                    updateRow(row.workerId, {
                                      observations: event.target.value,
                                    })
                                  }
                                  maxLength={2000}
                                  className="mt-2 block min-h-20 w-72 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0047a3]"
                                  placeholder="Observación del período"
                                />
                              )}
                              {rowErrors[row.workerId] && (
                                <p className="mt-2 max-w-sm text-xs font-bold text-red-700">
                                  {rowErrors[row.workerId]}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={row.baseRemuneration}
                            disabled={rowDisabled}
                            onChange={(event) =>
                              updateRow(row.workerId, {
                                baseRemuneration: event.target.value,
                                updateProfile: false,
                              })
                            }
                            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-right outline-none focus:border-[#0047a3] disabled:bg-gray-100"
                            placeholder="Pendiente"
                          />
                          {row.habitualBaseRemuneration === null &&
                          row.profileEligible ? (
                            <p className="mt-1 max-w-44 text-xs font-semibold text-amber-700">
                              Remuneración pendiente de configurar. Se creará
                              al guardar.
                            </p>
                          ) : row.habitualBaseRemuneration === null ? (
                            <p className="mt-1 max-w-44 text-xs text-gray-500">
                              Snapshot histórico. El trabajador ya no pertenece
                              al personal STAFF activo.
                            </p>
                          ) : (
                            row.baseRemuneration !==
                              row.habitualBaseRemuneration && (
                              <div className="mt-2 max-w-64 text-left">
                                <p className="text-xs text-gray-500">
                                  Sueldo habitual:{" "}
                                  {formatPen(row.habitualBaseRemuneration)}
                                </p>
                                <button
                                  type="button"
                                  aria-pressed={row.updateProfile}
                                  disabled={rowDisabled}
                                  onClick={() =>
                                    updateRow(row.workerId, {
                                      updateProfile: !row.updateProfile,
                                    })
                                  }
                                  className={
                                    "mt-1 rounded-md border px-2 py-1 text-xs font-bold " +
                                    (row.updateProfile
                                      ? "border-blue-600 bg-blue-50 text-blue-800"
                                      : "border-gray-300 bg-white text-gray-700")
                                  }
                                >
                                  {"Actualizar también el sueldo habitual para futuros períodos"}
                                </button>
                                <p className="mt-1 text-xs text-gray-500">
                                  No modifica planillas anteriores.
                                </p>
                              </div>
                            )
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.additionalIncome}
                            disabled={rowDisabled}
                            onChange={(event) =>
                              updateRow(row.workerId, {
                                additionalIncome: event.target.value,
                              })
                            }
                            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-right outline-none focus:border-[#0047a3] disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.manualDiscounts}
                            disabled={rowDisabled}
                            onChange={(event) =>
                              updateRow(row.workerId, {
                                manualDiscounts: event.target.value,
                              })
                            }
                            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-right outline-none focus:border-[#0047a3] disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#0f2545]">
                          {formatPen(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-extrabold text-slate-800">
                  <tr>
                    <td className="px-4 py-4">Total general</td>
                    <td className="px-4 py-4 text-right">
                      {formatPen(totals.base)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {formatPen(totals.additional)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {formatPen(totals.discounts)}
                    </td>
                    <td className="px-4 py-4 text-right text-[#0f2545]">
                      {formatPen(totals.net)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>
          )}

          {editable && rows.length > 0 && !duplicatePeriod && (
            <div className="flex justify-end">
              <ButtonSubmit
                label="Guardar planilla"
                loading={saving}
                loadingLabel="Guardando..."
                permission="staffPayroll.manage"
              />
            </div>
          )}
          <Toaster position="top-center" />
        </form>
      </Panel>
    </StaffPayrollAccess>
  );
}
