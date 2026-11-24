import { useMemo, useState } from "react";
import { Eye, FileSpreadsheet } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AddButton from "../../common/button/AddButton";
import LoadingSkeletonTable from "../../common/loading/LoadingSkeletonTable";
import Panel from "../../common/panel/Panel";
import Table, { type Column } from "../../common/table/Table";
import ActionButton from "../../components/ActionButton";
import { staffPayrollApi } from "../../data/apiUrl";
import type { StaffPayrollPeriod } from "../../data/types";
import { usePaginatedFetch } from "../../hooks";
import { useAccess } from "../../permissions/AccessProvider";
import StaffPayrollAccess from "./StaffPayrollAccess";
import { downloadStaffPayroll } from "./downloadStaffPayroll";
import { formatPen, periodLabel } from "./staffPayrollConfig";

export default function StaffPayrolls() {
  const { can } = useAccess();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState<string | null>(null);
  const {
    items,
    pagination,
    loading,
    error,
    setPage,
    setPageSize,
  } = usePaginatedFetch<StaffPayrollPeriod>(staffPayrollApi + "periods");

  const exportPeriod = async (period: StaffPayrollPeriod) => {
    const key = period.year + "-" + period.month;
    setExporting(key);
    try {
      await downloadStaffPayroll(period.year, period.month);
      toast.success("Archivo Excel generado.");
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "No se pudo exportar.",
      );
    } finally {
      setExporting(null);
    }
  };

  const columns = useMemo<readonly Column<StaffPayrollPeriod>[]>(
    () => [
      {
        key: "month",
        label: "Período",
        render: (period) => (
          <span className="font-bold text-slate-800">
            {periodLabel(period.year, period.month)}
          </span>
        ),
      },
      {
        key: "totalNetAmount",
        label: "Total neto",
        align: "right",
        render: (period) => (
          <span className="font-bold text-[#0f2545]">
            {formatPen(period.totalNetAmount)}
          </span>
        ),
      },
      {
        label: "Acciones",
        align: "right",
        render: (period) => {
          const key = period.year + "-" + period.month;
          return (
            <div className="flex justify-end gap-1">
              <ActionButton
                icon={<Eye />}
                label="Abrir planilla"
                variant="ghost"
                onClick={() =>
                  navigate(
                    "/admin/staff-payroll/" + period.year + "/" + period.month,
                  )
                }
              />
              {can("staffPayroll.export") && (
                <ActionButton
                  icon={<FileSpreadsheet />}
                  label="Exportar Excel"
                  variant="ghost"
                  onClick={() => void exportPeriod(period)}
                  disabled={exporting === key}
                />
              )}
            </div>
          );
        },
      },
    ],
    [can, exporting, navigate],
  );

  return (
    <StaffPayrollAccess>
      <Panel>
        <main className="flex w-full min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-[#0f2545]">
                Planillas mensuales STAFF
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestión de remuneraciones mensuales.
              </p>
            </div>
            <AddButton
              label="Nueva planilla"
              permission="staffPayroll.manage"
              onClick={() => navigate("/admin/staff-payroll/new")}
            />
          </header>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {loading && items.length === 0 ? (
            <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
              <LoadingSkeletonTable />
            </div>
          ) : items.length === 0 ? (
            <section className="w-full rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
              <p className="font-semibold text-slate-700">
                Todavía no existen planillas mensuales STAFF.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Crea la primera planilla para comenzar.
              </p>
            </section>
          ) : (
            <Table
              data={items}
              columns={columns}
              pagination={pagination}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              loading={loading}
              getRowKey={(period) => period.staffPayrollId}
            />
          )}
          <Toaster position="top-center" />
        </main>
      </Panel>
    </StaffPayrollAccess>
  );
}
