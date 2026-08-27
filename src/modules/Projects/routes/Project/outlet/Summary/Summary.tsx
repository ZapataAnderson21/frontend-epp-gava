import { Toaster } from "react-hot-toast";
import { useCurrentUser } from "../../../../../../hooks";
import { ErrorMessage } from "../../../../../../common/error";
import { adminTypes } from "../../../../../../utils";
import Permission from "../../../../../../common/auth/Permission";
import {
  ProjectInfoCard,
  RecordsSummaryCard,
  EconomicSummaryCard,
  ProjectProgressCard,
  ProjectTimelineCard,
} from "./sections";
import { useSummary } from "./hooks";

export default function Summary() {
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
    pettyCashTotals,
    payrollTotalsAmounts,
    purchaseOrdersSaleTotals,
    purchaseOrdersPurchaseTotals,
    purchaseOrdersSaleTotalsByType,
    purchaseOrdersPurchaseTotalsByType,
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
        <Permission user={user} allow={adminTypes}>
          <RecordsSummaryCard project={project} />
        </Permission>
      </div>

      {/* ===== Card 3: Resumen económico ===== */}
      <Permission user={user} allow={adminTypes}>
        <EconomicSummaryCard
          currency={currency}
          setCurrency={setCurrency}
          purchaseOrderSaleLoading={purchaseOrderSaleLoading}
          purchaseOrderPurchaseLoading={purchaseOrderPurchaseLoading}
          payrollTotalsLoading={payrollTotalsLoading}
          pettyCashLoading={pettyCashLoading}
          loading={loading}
          purchaseOrdersSaleTotals={purchaseOrdersSaleTotals}
          purchaseOrdersPurchaseTotals={purchaseOrdersPurchaseTotals}
          purchaseOrdersSaleTotalsByType={purchaseOrdersSaleTotalsByType}
          purchaseOrdersPurchaseTotalsByType={purchaseOrdersPurchaseTotalsByType}
          payrollTotalsAmounts={payrollTotalsAmounts}
          pettyCashTotals={pettyCashTotals}
          utilitiesTotals={utilitiesTotals}
        />
      </Permission>

      {/* ===== Card 4: Avance del proyecto ===== */}
      <ProjectProgressCard projectId={projectId} />

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
