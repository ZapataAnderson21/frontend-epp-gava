import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useFetch } from "../../../../../../../hooks";
import type { Project } from "../../../../../../../data/types";
import { pettyCashApi, projectApi, purchaseOrderApi, workerApi } from "../../../../../../../data/apiUrl";
import type { Currency } from "../../../../../../../data/types";
import type { PayrollTotals, PurchaseOrderAmounts, UseSummaryReturn } from "../types";

export function useSummary(): UseSummaryReturn {
  const { id: projectId } = useParams<{ id: string }>();

  // Currency state
  const [currency, setCurrency] = useState<Currency>("PEN");
  
  // Date states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // API calls
  const { data: project, loading, error } = useFetch<Project>(
    `${projectApi}${projectId}`,
    [projectId]
  );
  
  const { data: pettyCashPEN, loading: pettyCashLoading } = useFetch<number>(
    `${pettyCashApi}sum/${projectId}`,
    [projectId]
  );
  
  const { data: purchaseOrderSaleAmounts, loading: purchaseOrderSaleLoading } = useFetch<PurchaseOrderAmounts>(
    `${purchaseOrderApi}saleAmounts/${projectId}?currency=${currency}`,
    [projectId, currency]
  );
  
  const { data: purchaseOrderPurchaseAmounts, loading: purchaseOrderPurchaseLoading } = useFetch<PurchaseOrderAmounts>(
    `${purchaseOrderApi}purchaseAmounts/${projectId}?currency=${currency}`,
    [projectId, currency]
  );
  
  const { data: payrollTotals, loading: payrollTotalsLoading } = useFetch<PayrollTotals>(
    `${workerApi}totals/${projectId}`,
    [projectId]
  );

  // Calculated totals
  const pettyCashTotals = {
    PEN: pettyCashPEN ? Number(pettyCashPEN) : 0,
    USD: 0,
    EUR: 0,
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
      (purchaseOrdersSaleTotals.PEN || 0) -
      (purchaseOrdersPurchaseTotals.PEN + pettyCashTotals.PEN + payrollTotalsAmounts.PEN || 0),
    USD:
      (purchaseOrdersSaleTotals.USD || 0) -
      (purchaseOrdersPurchaseTotals.USD + pettyCashTotals.USD + payrollTotalsAmounts.USD || 0),
    EUR:
      (purchaseOrdersSaleTotals.EUR || 0) -
      (purchaseOrdersPurchaseTotals.EUR + pettyCashTotals.EUR + payrollTotalsAmounts.EUR || 0),
  };

  // Effects
  useEffect(() => {
    setStartDate(project?.startDate?.split("T")[0] || "");
    setEndDate(project?.endDate?.split("T")[0] || "");
  }, [project]);

  return {
    // Project data
    project,
    projectId,
    loading,
    error,

    // Dates
    startDate,
    endDate,

    // Currency
    currency,
    setCurrency,

    // Loading states
    pettyCashLoading,
    purchaseOrderSaleLoading,
    purchaseOrderPurchaseLoading,
    payrollTotalsLoading,

    // Calculated totals
    pettyCashTotals,
    payrollTotalsAmounts,
    purchaseOrdersSaleTotals,
    purchaseOrdersPurchaseTotals,
    utilitiesTotals,
  };
}
