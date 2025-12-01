import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { MdOutlineContentCopy } from "react-icons/md";
import { useCurrentUser, useFetch } from "../../../hooks";
import type { Project } from "../../../data/types";
import { pettyCashApi, projectApi, purchaseOrderApi, workerApi } from "../../../data/apiUrl";
import { SectionProjectSummary } from "../sections";
import { type Currency, ColumnCard, CurrencyFilter, MoneyTrendCard, ProjectProgress, ProjectTimeline } from "../components";
import { ErrorMessage } from "../../../common/error";
import { adminTypes } from "../../../utils";
import Permission from "../../../common/auth/Permission";
import { TbCalendar, TbLocation } from "react-icons/tb";
import { CgSpinner } from "react-icons/cg";
import { SeeButton } from "../../../common/button";
import { statusColor } from "../ProjectTable";

interface PurchaseOrderAmounts {
  totalPEN: number;
  totalUSD: number;
  totalEUR: number;
}

export default function Summary() {

  const { id: projectId } = useParams<{ id: string }>();

  const { user } = useCurrentUser();

  const [currency, setCurrency] = React.useState<Currency>("PEN");

  const { data: project, loading, error } = useFetch<Project>( `${projectApi}${projectId}`, [projectId]);
  const { data: pettyCashPEN, loading: pettyCashLoading } = useFetch<number>(`${pettyCashApi}sum/${projectId}`, [projectId]);
  const { data: purchaseOrderSaleAmounts, loading: purchaseOrderSaleLoading } = useFetch<PurchaseOrderAmounts>(`${purchaseOrderApi}saleAmounts/${projectId}?currency=${currency}`, [projectId, currency]);
  const { data: purchaseOrderPurchaseAmounts, loading: purchaseOrderPurchaseLoading } = useFetch<PurchaseOrderAmounts>(`${purchaseOrderApi}purchaseAmounts/${projectId}?currency=${currency}`, [projectId, currency]);
  const { data: payrollTotals, loading: payrollTotalsLoading } = useFetch<{laborerAmount: number; technicianAmount: number; totalAmount: number}>(`${workerApi}totals/${projectId}`, [projectId]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const pettyCashTotals = { 
    PEN: pettyCashPEN ? Number(pettyCashPEN) : 0, 
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
      (purchaseOrdersSaleTotals.PEN || 0) - (purchaseOrdersPurchaseTotals.PEN + pettyCashTotals.PEN + payrollTotalsAmounts.PEN || 0),
    USD:
      (purchaseOrdersSaleTotals.USD || 0) - (purchaseOrdersPurchaseTotals.USD + pettyCashTotals.USD + payrollTotalsAmounts.USD || 0),
    EUR:
      (purchaseOrdersSaleTotals.EUR || 0) - (purchaseOrdersPurchaseTotals.EUR + pettyCashTotals.EUR + payrollTotalsAmounts.EUR || 0),
  };

  const copyCode = () => {
    if (project?.code) {
      navigator.clipboard.writeText(project.code);
      toast('Código copiado al portapapeles', {
        icon: <MdOutlineContentCopy />,
      });
    }
  };

  const navigate = useNavigate();
  
  useEffect(() => {
    setStartDate(project?.startDate?.split("T")[0] || "");
    setEndDate(project?.endDate?.split("T")[0] || "");
  }, [project]);
  
  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-6 w-full">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="col-span-1 w-full flex flex-col gap-6">
        <div className="w-full flex flex-col gap-2 bg-white border border-gray-50 rounded-xl px-5 py-7 shadow-sm h-full">
          <h3 className="text-xl font-extrabold text-gray-800">Información del Proyecto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-2 w-full">
            
            <div className="col-span-1">
              <h4 className="font-bold">Código</h4>
              <div className="flex flex-row gap-2 items-center cursor-pointer w-fit" onClick={copyCode}>
                <MdOutlineContentCopy className="text-gray-700" />
                <span className="text-sm text-gray-500">
                  {loading ? <CgSpinner className="animate-spin" /> : project?.code || "N/A"}
                </span>
              </div>
            </div>

            <div className="col-span-1">
              <h4 className="font-bold">Ubicación</h4>
              <div className="flex flex-row gap-2 justify-start items-center">
                <TbLocation className="text-gray-700" />
                <span className="text-sm text-gray-500">
                  {loading ? <CgSpinner className="animate-spin" /> : project?.location || "—"}
                </span>
              </div>
            </div>

            
            <div className="col-span-2">
              <h4 className="font-bold">Duración</h4>
              <div className="flex flex-row gap-2 items-center">
                <div className="p-1">
                  <TbCalendar className="text-gray-700" />
                </div>
                <span className="text-sm text-gray-500">
                  {loading ? <CgSpinner className="animate-spin" /> : startDate ? 
                  startDate.split("-").reverse().join("/").concat(` - ${endDate.split("-").reverse().join("/")}`): "—"}
                </span>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <h4 className="font-bold">Descripción</h4>
              <div className="flex flex-row gap-2 items-center">
                <span className="text-sm text-gray-500">
                    {loading ? <CgSpinner className="animate-spin" /> : project?.description ? project.description : "N/A"}
                  </span>
              </div>
            </div>
          </div>
        </div>

        <Permission user={user} allow={adminTypes} fallback={<div />}>
          <ColumnCard title="Resumen de registros">
            <div className="w-full rounded-xl">
              <div className="flex flex-row justify-between bg-sky-50 p-2 rounded-tr-xl rounded-tl-xl">
                <span>Órdenes de Compra</span>
                <span className="font-semibold">{project?.purchaseOrders?.length ?? 0}</span>
              </div>
              <div className="flex flex-row justify-between bg-gray-50 p-2">
                <span>Requerimientos</span>
                <span className="font-semibold">{project?.requests?.length ?? 0}</span>
              </div>
              <div className="flex flex-row justify-between bg-sky-50 p-2">
                <span>Caja Chica</span>
                <span className="font-semibold">{project?.pettyCashes?.length ?? 0}</span>
              </div>
              <div className="flex flex-row justify-between bg-gray-50 p-2 rounded-br-xl rounded-bl-xl">
                <span>Emergencias</span>
                <span className="font-semibold">{project?.emergencies?.length ?? 0}</span>
              </div>
            </div>
          </ColumnCard>
        </Permission>
      </div>

      {/* ===== COLUMNA 3: Resumen económico ===== */}
      
      <div className="col-span-1">
        <Permission user={user} allow={adminTypes} fallback={<div />}>
        <div className="flex flex-col w-full bg-white border border-gray-50 rounded-xl p-5 shadow-sm h-full">
          <div className="flex flex-col mb-4 gap-2">
            <h3 className="text-xl font-extrabold text-gray-800">Resumen Económico</h3>
            <div className="flex w-full justify-end">
              <div className="w-fit">
                <CurrencyFilter currency={currency} onChange={setCurrency} />
              </div>
            </div>
          </div>
          <div className="space-y-4">
              {/* Ingresos */}
              <SectionProjectSummary title="Ingresos" trend="up">
                <MoneyTrendCard
                  index={1}
                  loading={purchaseOrderSaleLoading}
                  title="Órdenes de Compra"
                  trend="up"
                  currency={currency}
                  amountsByCurrency={purchaseOrdersSaleTotals}
                />
              </SectionProjectSummary>

              {/* Gastos */}
              <SectionProjectSummary title="Gastos" trend="down">
                <MoneyTrendCard
                  index={1} 
                  loading={purchaseOrderPurchaseLoading} 
                  title="Órdenes de Compra" 
                  trend="down" 
                  currency={currency} 
                  amountsByCurrency={purchaseOrdersPurchaseTotals} 
                />
                <MoneyTrendCard
                  index={2}
                  loading={payrollTotalsLoading} 
                  title="Planillas" 
                  trend="down" 
                  currency={currency} 
                  amountsByCurrency={payrollTotalsAmounts} 
                />
                <MoneyTrendCard
                  index={3} 
                  loading={pettyCashLoading} 
                  title="Caja Chica" 
                  trend="down" 
                  currency={currency} 
                  amountsByCurrency={pettyCashTotals} 
                />
              </SectionProjectSummary>

              {/* Utilidades */}
              <SectionProjectSummary title="Utilidades" trend="equal">
                <MoneyTrendCard 
                  index={1}
                  loading={loading} 
                  title={currency} 
                  trend="flat" 
                  currency={currency} 
                  amountsByCurrency={utilitiesTotals} 
                />
              </SectionProjectSummary>
            </div>
        </div>
        </Permission>
      </div>

      {/* ===== COLUMNA 2: Avance del proyecto ===== */}
      <div className="flex flex-col w-full bg-white border border-gray-50 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <h3 className="text-xl font-extrabold text-gray-800">Avance del Proyecto</h3>
          <SeeButton onClick={() => navigate(`/admin/projects/${projectId}/progress`)}  />
        </div>
        <ProjectProgress projectId={projectId} />
      </div>

      <div className="flex flex-col w-full bg-white border border-gray-50 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <h3 className="text-xl font-extrabold text-gray-800">Tiempo del Proyecto</h3>
          <span className={`px-2 py-1 rounded-full text-white font-semibold text-sm`} 
                style={{ backgroundColor: statusColor[project?.status as keyof typeof statusColor] || '#9ca3af' }}>
                  {project?.status.toUpperCase()}
          </span>
          </div>
        <ProjectTimeline 
          loading={loading} 
          startDate={project?.startDate} 
          endDate={project?.endDate} 
        />
      </div>
    </div>
  );
}