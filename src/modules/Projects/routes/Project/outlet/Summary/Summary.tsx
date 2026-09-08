import { useAccess } from "../../../../../../permissions/AccessProvider";
import { Toaster } from "react-hot-toast";
import Permission from "../../../../../../common/auth/Permission";
import { ErrorMessage } from "../../../../../../common/error";
import { useCurrentUser } from "../../../../../../hooks";
import { useSummary } from "./hooks";
import {
  EconomicSummaryCard,
  ProjectInfoCard,
  ProjectProgressCard,
  ProjectTimelineCard,
  RecordsSummaryCard,
} from "./sections";

export default function Summary() {
  const { can } = useAccess();
  const completeFinance = [
    "finance.view",
    "orders.view",
    "incomes.view",
    "payroll.view",
    "cash.view",
  ].every(can);
  const { user } = useCurrentUser();
  const {
    project,
    projectId,
    loading,
    error,
    startDate,
    endDate,
    currency,
    setCurrency,
    pettyCashLoading,
    purchaseOrderSaleLoading,
    purchaseOrderPurchaseLoading,
    payrollTotalsLoading,
    serviceSaleLoading,
    pettyCashTotals,
    payrollTotalsAmounts,
    purchaseOrdersSaleTotals,
    purchaseOrdersPurchaseTotals,
    purchaseOrdersSaleTotalsByType,
    purchaseOrdersPurchaseTotalsByType,
    registeredIncomeTotals,
    utilitiesTotals,
  } = useSummary();

  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-6 w-full">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="col-span-1 w-full flex flex-col gap-6">
        {/* ===== Card 1: Información del Proyecto ===== */}
        <ProjectInfoCard
          project={project}
          loading={loading}
          startDate={startDate}
          endDate={endDate}
        />

        {/* ===== Card 2: Resumen de registros ===== */}
        <Permission user={user} permission="projects.view">
          <RecordsSummaryCard project={project} />
        </Permission>
      </div>

      {/* ===== Card 3: Resumen económico ===== */}
      <Permission user={user} permission="finance.view">
        {completeFinance ? (
          <EconomicSummaryCard
            currency={currency}
            setCurrency={setCurrency}
            purchaseOrderSaleLoading={purchaseOrderSaleLoading}
            purchaseOrderPurchaseLoading={purchaseOrderPurchaseLoading}
            payrollTotalsLoading={payrollTotalsLoading}
            serviceSaleLoading={serviceSaleLoading}
            pettyCashLoading={pettyCashLoading}
            loading={
              loading ||
              purchaseOrderSaleLoading ||
              purchaseOrderPurchaseLoading ||
              payrollTotalsLoading ||
              pettyCashLoading ||
              serviceSaleLoading
            }
            purchaseOrdersSaleTotals={purchaseOrdersSaleTotals}
            purchaseOrdersPurchaseTotals={purchaseOrdersPurchaseTotals}
            purchaseOrdersSaleTotalsByType={purchaseOrdersSaleTotalsByType}
            purchaseOrdersPurchaseTotalsByType={
              purchaseOrdersPurchaseTotalsByType
            }
            registeredIncomeTotals={registeredIncomeTotals}
            payrollTotalsAmounts={payrollTotalsAmounts}
            pettyCashTotals={pettyCashTotals}
            utilitiesTotals={utilitiesTotals}
          />
        ) : (
          <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
            El resumen económico requiere acceso a todas sus fuentes.
          </p>
        )}
      </Permission>

      {/* ===== Card 4: Avance del proyecto ===== */}
      <Permission permission="progress.view">
        <ProjectProgressCard projectId={projectId} />
      </Permission>

      {/* ===== Card 5: Línea de tiempo del proyecto ===== */}
      <ProjectTimelineCard
        loading={loading}
        status={project?.status}
        startDate={project?.startDate}
        endDate={project?.endDate}
      />
    </div>
  );
}
