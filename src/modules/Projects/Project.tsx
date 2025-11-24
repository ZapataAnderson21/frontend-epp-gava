import React from "react";
import { useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { MdOutlineContentCopy } from "react-icons/md";
import { IoIosArrowUp } from "react-icons/io";
import { useCurrentUser, useFetch } from "../../hooks";
import type { Project } from "../../data/types";
import { pettyCashApi, projectApi, purchaseOrderApi, serviceSaleApi, workerApi } from "../../data/apiUrl";
import { SectionProjectSummary, HeaderActions, HeaderSection } from "./sections";
import { type Currency, CurrencyFilter, MoneyTrendCard, CountCard, InfoCard } from "./components";
import { HeaderPanel, Panel } from "../../common/panel";
import { ErrorMessage } from "../../common/error";
import { formatDate, adminTypes } from "../../utils";
import Permission from "../../common/auth/Permission";
import { TbCalendarCheck, TbCalendarOff, TbLocation } from "react-icons/tb";

interface PurchaseOrderAmounts {
  totalPEN: number;
  totalUSD: number;
  totalEUR: number;
}

export default function Project() {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useCurrentUser();

  const [currency, setCurrency] = React.useState<Currency>("PEN");

  const [collapsed, setCollapsed] = React.useState<{ info: boolean; regs: boolean }>({
    info: false,
    regs: false,
  });

  const toggleSection = (key: "info" | "regs") =>
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const { data: project, loading, error } = useFetch<Project>( `${projectApi}${projectId}`, [projectId]);
  const { data: pettyCashPEN, loading: pettyCashLoading } = useFetch<number>(`${pettyCashApi}sum/${projectId}`, [projectId]);
  const { data: servicesTotalsPEN, loading: servicesTotalsLoading } = useFetch<number>(`${serviceSaleApi}sum/${projectId}`, [projectId]);
  const { data: purchaseOrderSaleAmounts, loading: purchaseOrderSaleLoading } = useFetch<PurchaseOrderAmounts>(`${purchaseOrderApi}saleAmounts/${projectId}?currency=${currency}`, [projectId, currency]);
  const { data: purchaseOrderPurchaseAmounts, loading: purchaseOrderPurchaseLoading } = useFetch<PurchaseOrderAmounts>(`${purchaseOrderApi}purchaseAmounts/${projectId}?currency=${currency}`, [projectId, currency]);
  const { data: payrollTotals, loading: payrollTotalsLoading } = useFetch<{laborerAmount: number; technicianAmount: number; totalAmount: number}>(`${workerApi}totals/${projectId}`, [projectId]);

  const pettyCashTotals = { 
    PEN: pettyCashPEN ? Number(pettyCashPEN) : 0, 
    USD: 0, 
    EUR: 0 
  };
  
  const servicesTotals  = { 
    PEN: servicesTotalsPEN ? Number(servicesTotalsPEN) : 0, 
    USD: 0, 
    EUR: 0 
  };
  
  const payrollTotalsAmounts = {
    PEN: payrollTotals?.totalAmount ?? 0,
    USD: 0,
    EUR: 0,
  };

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


  const utilitiesTotals = {
    PEN:
      (purchaseOrdersSaleTotals.PEN || 0) - (purchaseOrdersPurchaseTotals.PEN + pettyCashTotals.PEN + servicesTotals.PEN + payrollTotalsAmounts.PEN || 0),
    USD:
      (purchaseOrdersSaleTotals.USD || 0) - (purchaseOrdersPurchaseTotals.USD + pettyCashTotals.USD + servicesTotals.USD + payrollTotalsAmounts.USD || 0),
    EUR:
      (purchaseOrdersSaleTotals.EUR || 0) - (purchaseOrdersPurchaseTotals.EUR + pettyCashTotals.EUR + servicesTotals.EUR + payrollTotalsAmounts.EUR || 0),
  };

  const copyCode = () => {
    if (project?.code) {
      navigator.clipboard.writeText(project.code);
      toast('Código copiado al portapapeles', {
        icon: <MdOutlineContentCopy />,
      });
    }
  };

  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <Panel>
      <Toaster position="top-center" reverseOrder={false} />

      <HeaderPanel loading={loading} name={`${project ? project?.name : ""}`}>
        {projectId && <HeaderActions />}
      </HeaderPanel>

      <div className="flex flex-col w-full">
        {project?.description && (
          <p><span className="font-bold">Descripción: </span>{project?.description}</p>
        )}
      </div>

      <div className="flex flex-col w-full gap-4">
        {/* ===== Información del proyecto ===== */}
        <HeaderSection title="Información del proyecto">
          <button
            type="button"
            onClick={() => toggleSection("info")}
            aria-expanded={!collapsed.info}
            aria-controls="section-info"
            className="flex items-center gap-2 p-1 rounded hover:bg-gray-100"
            title={collapsed.info ? "Mostrar sección" : "Ocultar sección"}
          >
            <IoIosArrowUp
              className={`transition-transform duration-200 ${collapsed.info ? "-rotate-180" : "rotate-0"}`}
              aria-hidden="true"
            />
          </button>
        </HeaderSection>

        {!collapsed.info && (
          <div id="section-info" className="flex flex-col gap-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-4">
              <InfoCard loading={loading} title="Código" info={project?.code || "N/A"}>
                <button
                  type="button"
                  onClick={copyCode}
                  className="flex items-center justify-center border border-gray-300 rounded-md p-2 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                  title="Copiar código"
                >
                  <MdOutlineContentCopy className="flex" />
                </button>
              </InfoCard>

              <InfoCard loading={loading} title="Ubicación" info={project?.location || ""} >
                <TbLocation className="text-2xl" />
              </InfoCard>

              <InfoCard loading={loading} title="Estado" info={project?.status || ""}>
                <div
                  style={{ backgroundColor: project?.status === "Activo" ? "green" : "red" }}
                  className="size-4 aspect-square rounded-full"
                />
              </InfoCard>

              <InfoCard loading={loading} title="Fecha de Inicio" info={formatDate(project?.startDate) || "--"} >
                <TbCalendarCheck className="text-2xl" />
              </InfoCard>
              <InfoCard loading={loading} title="Fecha de Fin" info={formatDate(project?.endDate) || "--"}>
                <TbCalendarOff className="text-2xl" />
              </InfoCard>
            </div>
          </div>
        )}

        {
          <Permission user={user} allow={adminTypes}>
            <>
              <hr className="border-t border-gray-200" />
              {/* ===== Resumen de registros ===== */}
              <HeaderSection title="Resumen de registros">
                <button
                  type="button"
                  onClick={() => toggleSection("regs")}
                  aria-expanded={!collapsed.regs}
                  aria-controls="section-regs"
                  className="flex items-center gap-2 p-1 rounded hover:bg-gray-100"
                  title={collapsed.regs ? "Mostrar sección" : "Ocultar sección"}
                >
                  <IoIosArrowUp
                    className={`transition-transform duration-200 ${collapsed.regs ? "-rotate-180" : "rotate-0"}`}
                    aria-hidden="true"
                  />
                </button>
              </HeaderSection>

              {!collapsed.regs && (
                <div id="section-regs" className="flex flex-col gap-4 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-4">
                    <CountCard loading={loading} title="Órdenes de Compra" count={project?.purchaseOrders?.length ?? 0} to={`/admin/purchase-orders?projectId=${projectId}`} />
                    <CountCard loading={loading} title="Requerimientos"   count={project?.requests?.length ?? 0}       to={`/admin/requests?projectId=${projectId}`} />
                    <CountCard loading={loading} title="Caja Chica"       count={project?.pettyCashes?.length ?? 0}    to={`/admin/petty-cash?projectId=${projectId}`} />
                    <CountCard loading={loading} title="Emergencias"      count={project?.emergencies?.length ?? 0}    to={`/admin/emergencies?projectId=${projectId}`} />
                    <CountCard loading={loading} title="Planillas / Asistencias"       count={0}       to={`/admin/projects/payrolls/${projectId}`} />
                  </div>
                </div>
              )}

              <hr className="border-t border-gray-200" />

              {/* ===== Resumen económico ===== */}
              <HeaderSection title="Resumen económico">
                <CurrencyFilter currency={currency} onChange={setCurrency} />
              </HeaderSection>

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
                <MoneyTrendCard loading={payrollTotalsLoading} title="Planillas" trend="down" currency={currency} amountsByCurrency={payrollTotalsAmounts} />
                <MoneyTrendCard loading={servicesTotalsLoading} title="Servicios" trend="down" currency={currency} amountsByCurrency={servicesTotals} />
                <MoneyTrendCard loading={pettyCashLoading} title="Caja Chica" trend="down" currency={currency} amountsByCurrency={pettyCashTotals} />
              </SectionProjectSummary>

              {/* Utilidades */}
              <SectionProjectSummary title="Utilidades">
                <MoneyTrendCard loading={loading} title={currency} trend="flat" currency={currency} amountsByCurrency={utilitiesTotals} />
              </SectionProjectSummary>
            </>
          </Permission>
        }
      </div>
    </Panel>
  );
}
