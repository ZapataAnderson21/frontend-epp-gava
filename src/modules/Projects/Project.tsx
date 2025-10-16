import React from "react";
import { useParams } from "react-router-dom";
import { HeaderPanel, Panel } from "../../common/panel";
import { useFetch } from "../../hooks";
import type { ProjectType } from "../../data/types";
import { pettyCashApi, projectApi, purchaseOrderApi, serviceSaleApi } from "../../data/apiUrl";

import SectionProjectSummary from "./sections/SectionProjectSummary";
import CountCard from "./components/CountCard";
import MoneyTrendCard from "./components/MoneyTrendCard";
import HeaderActions from "./sections/HeaderActions";
import CurrencyFilter, { type Currency } from "./components/CurrencyFilter";
import { ErrorMessage } from "../../common/error";

interface PurchaseOrderAmounts {
  totalPEN: number;
  totalUSD: number;
  totalEUR: number;
}

export default function Project() {
  const { id: projectId } = useParams<{ id: string }>();

  const [currency, setCurrency] = React.useState<Currency>("PEN");

  const { data: project, loading, error } = useFetch<ProjectType>( `${projectApi}${projectId}`, [projectId]);
  const { data: pettyCashPEN, loading: pettyCashLoading } = useFetch<number>(`${pettyCashApi}sum/${projectId}`, [projectId]);
  const { data: servicesTotalsPEN, loading: servicesTotalsLoading } = useFetch<number>(`${serviceSaleApi}sum/${projectId}`, [projectId]);
  const { data: purchaseOrderSaleAmounts, loading: purchaseOrderSaleLoading } = useFetch<PurchaseOrderAmounts>(`${purchaseOrderApi}saleAmounts/${projectId}?currency=${currency}`, [projectId, currency]);
  const { data: purchaseOrderPurchaseAmounts, loading: purchaseOrderPurchaseLoading } = useFetch<PurchaseOrderAmounts>(`${purchaseOrderApi}purchaseAmounts/${projectId}?currency=${currency}`, [projectId, currency]);

  const pettyCashTotals = { PEN: pettyCashPEN ? Number(pettyCashPEN) : 0, USD: 0, EUR: 0 };
  const payrollTotals   = { PEN: 0, USD: 0, EUR: 0 };
  const servicesTotals  = { PEN: servicesTotalsPEN ? Number(servicesTotalsPEN) : 0, USD: 0, EUR: 0 };

  const purchaseOrdersSaleTotals = {
    PEN: purchaseOrderSaleAmounts?.totalPEN ?? 0,
    USD: purchaseOrderSaleAmounts?.totalUSD ?? 0,
    EUR: purchaseOrderSaleAmounts?.totalEUR ?? 0,
  };
  const purchaseOrdersPurchaseTotals = {
    PEN: purchaseOrderPurchaseAmounts?.totalPEN ?? 0,
    USD: purchaseOrderPurchaseAmounts?.totalUSD ?? 0,
    EUR: purchaseOrderPurchaseAmounts?.totalEUR ?? 0,
  };

  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <Panel>
      <HeaderPanel 
        loading={loading}
        name={`${project ? project?.name : ""}`}>
        {projectId && (
          <HeaderActions />
        )}
      </HeaderPanel>

      <div className="flex flex-col w-full gap-4">
        {/* Resumen */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-4">
            <CountCard
              loading = {loading}
              title="Órdenes de Compra"
              count={project?.purchaseOrders?.length ?? 0}
              to={`/admin/purchase-orders?projectId=${projectId}`}
            />
            <CountCard
              loading = {loading}
              title="Requerimientos"
              count={project?.requests?.length ?? 0}
              to={`/admin/requests?projectId=${projectId}`}
            />
            <CountCard
              loading = {loading}
              title="Caja Chica"
              count={project?.pettyCashes?.length ?? 0}
              to={`/admin/petty-cash?projectId=${projectId}`}
            />
            <CountCard
              loading = {loading}
              title="Servicios"
              count={project?.serviceSales?.length ?? 0}
              to={`/admin/service-sale?projectId=${projectId}`}
            />
            <CountCard
              loading = {loading}
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
            loading={purchaseOrderSaleLoading}
            title="Órdenes de Compra"
            trend="up"
            currency={currency}
            amountsByCurrency={purchaseOrdersSaleTotals}
          />
        </SectionProjectSummary>

        {/* Gastos */}
        <SectionProjectSummary title="Gastos">
          <MoneyTrendCard loading={purchaseOrderPurchaseLoading} title="Órdenes de Compra" trend="down" currency={currency} amountsByCurrency={purchaseOrdersPurchaseTotals} />
          <MoneyTrendCard loading={loading} title="Planillas"        trend="down" currency={currency} amountsByCurrency={payrollTotals} />
          <MoneyTrendCard loading={servicesTotalsLoading} title="Servicios"        trend="down" currency={currency} amountsByCurrency={servicesTotals} />
          <MoneyTrendCard loading={pettyCashLoading} title="Caja Chica"       trend="down" currency={currency} amountsByCurrency={pettyCashTotals} />
        </SectionProjectSummary>

        {/* Utilidades */}
        <SectionProjectSummary title="Utilidades">
          <MoneyTrendCard loading={loading} title={currency} trend="flat" currency={currency} amountsByCurrency={{ PEN: 0, USD: 0, EUR: 0 }} />
        </SectionProjectSummary>
      </div>
    </Panel>
  );
}
