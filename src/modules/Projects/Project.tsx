import React from "react";
import { useParams } from "react-router-dom";
import { HeaderPanel, Panel } from "../../common/panel";
import { useFetch } from "../../hooks";
import type { ProjectType } from "../../data/types";
import { projectApi } from "../../data/apiUrl";

import SectionProjectSummary from "./sections/SectionProjectSummary";
import CountCard from "./components/CountCard";
import MoneyTrendCard, { DEFAULT_RATES } from "./components/MoneyTrendCard";
import HeaderActions from "./sections/HeaderActions";
import CurrencyFilter, { type Currency } from "./components/CurrencyFilter";

export default function Project() {
  const { id: projectId } = useParams<{ id: string }>();

  const { data: project, loading, error } = useFetch<ProjectType>(
    `${projectApi}${projectId}`,
    [projectId]
  );

  const [currency, setCurrency] = React.useState<Currency>("PEN");
  const [rates] = React.useState(DEFAULT_RATES); // podrías traer esto del backend

  return (
    <Panel>
      <HeaderPanel name={`${project ? project?.name : ""}`}>
        {projectId && (
          <HeaderActions
            projectId={projectId}
          />
        )}
      </HeaderPanel>

      <div className="flex flex-col w-full gap-4">
        {/* Resumen */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-4">
            <CountCard
              title="Órdenes de Compra"
              count={project?.purchaseOrders?.length ?? 0}
              to={`/admin/purchase-orders?projectId=${projectId}`}
            />
            <CountCard
              title="Requerimientos"
              count={project?.requests?.length ?? 0}
              to={`/admin/requests?projectId=${projectId}`}
            />
            <CountCard
              title="Caja Chica"
              count={project?.pettyCashes?.length ?? 0}
              to={`/admin/petty-cash?projectId=${projectId}`}
            />
            <CountCard
              title="Servicios"
              count={project?.serviceSales?.length ?? 0}
              to={`/admin/service-sales?projectId=${projectId}`}
            />
            <CountCard
              title="Emergencias"
              count={project?.emergencies?.length ?? 0}
              to={`/admin/emergencies?projectId=${projectId}`}
            />
          </div>
        </div>

        <hr className="border-t border-gray-200" />

        <div className="flex w-full justify-between items-center">
          <h2 className="text-2xl font-extrabold">Resumen económico</h2>
          <CurrencyFilter currency={currency} onChange={setCurrency} />
        </div>

        {/* Ingresos */}
        <SectionProjectSummary title="Ingresos">
          <MoneyTrendCard
            title="Órdenes de Compra"
            amountPen={88888}
            trend="up"
            currency={currency}
            rates={rates}
          />
        </SectionProjectSummary>

        {/* Gastos */}
        <SectionProjectSummary title="Gastos">
          <MoneyTrendCard title="Órdenes de Compra" amountPen={88888} trend="down" currency={currency} rates={rates} />
          <MoneyTrendCard title="Planillas"        amountPen={88888} trend="down" currency={currency} rates={rates} />
          <MoneyTrendCard title="Servicios"        amountPen={88888} trend="down" currency={currency} rates={rates} />
          <MoneyTrendCard title="Caja Chica"       amountPen={88888} trend="down" currency={currency} rates={rates} />
        </SectionProjectSummary>

        {/* Utilidades */}
        <SectionProjectSummary title="Utilidades">
          <MoneyTrendCard title={currency} amountPen={88888} trend="flat" currency={currency} rates={rates} />
        </SectionProjectSummary>
      </div>

      {/* Loading / Error lightweight inline states */}
      {loading && <div className="text-sm text-gray-500">Cargando información del proyecto…</div>}
      {error &&   <div className="text-sm text-red-600">Ocurrió un error al cargar el proyecto.</div>}
    </Panel>
  );
}
