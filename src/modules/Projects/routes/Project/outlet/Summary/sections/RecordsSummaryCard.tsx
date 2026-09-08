import type { Project } from "../../../../../../../data/types";
import { useAccess } from "../../../../../../../permissions/AccessProvider";
import ColumnCard from "../components/ColumnCard";

interface RecordsSummaryCardProps {
  project: Project | null;
}

export default function RecordsSummaryCard({
  project,
}: RecordsSummaryCardProps) {
  const { can } = useAccess();
  return (
    <ColumnCard title="Resumen de registros">
      <div className="w-full rounded-xl">
        {can("orders.view") && (
          <div className="flex flex-row justify-between bg-sky-50 p-2 rounded-tr-xl rounded-tl-xl">
            <span>Órdenes de Compra</span>
            <span className="font-semibold">
              {project?.purchaseOrders?.length ?? 0}
            </span>
          </div>
        )}
        {can("requests.view") && (
          <div className="flex flex-row justify-between bg-gray-50 p-2">
            <span>Requerimientos</span>
            <span className="font-semibold">
              {project?.requests?.length ?? 0}
            </span>
          </div>
        )}
        {can("cash.view") && (
          <div className="flex flex-row justify-between bg-sky-50 p-2">
            <span>Caja Chica</span>
            <span className="font-semibold">
              {project?.pettyCashes?.length ?? 0}
            </span>
          </div>
        )}
        {can("incomes.view") && (
          <div className="flex flex-row justify-between bg-gray-50 p-2">
            <span>Ingresos</span>
            <span className="font-semibold">
              {project?.serviceSales?.length ?? 0}
            </span>
          </div>
        )}
        {can("emergencies.view") && (
          <div className="flex flex-row justify-between bg-sky-50 p-2 rounded-br-xl rounded-bl-xl">
            <span>Emergencias</span>
            <span className="font-semibold">
              {project?.emergencies?.length ?? 0}
            </span>
          </div>
        )}
      </div>
    </ColumnCard>
  );
}
