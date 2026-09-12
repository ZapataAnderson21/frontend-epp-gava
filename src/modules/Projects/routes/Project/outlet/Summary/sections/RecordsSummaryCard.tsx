import type { Project } from "../../../../../../../data/types";
import { useAccess } from "../../../../../../../permissions/AccessProvider";
import ColumnCard from "../components/ColumnCard";
import { Link } from "react-router-dom";

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
          <Link
            to="purchase-orders"
            className="flex cursor-pointer flex-row justify-between rounded-tl-xl rounded-tr-xl bg-sky-50 p-2 transition-colors hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14519d]"
            aria-label={`Ver ${project?.purchaseOrders?.length ?? 0} órdenes de compra`}
          >
            <span>Órdenes de Compra</span>
            <span className="font-semibold">
              {project?.purchaseOrders?.length ?? 0}
            </span>
          </Link>
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
