import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  generalPayrollApi,
  pettyCashApi,
  projectApi,
  purchaseOrderApi,
  serviceSaleApi,
} from "../../../../../../../data/apiUrl";
import type { Currency, Project } from "../../../../../../../data/types";
import { useFetch } from "../../../../../../../hooks";
import { useAccess } from "../../../../../../../permissions/AccessProvider";
import type {
  AmountsByCurrency,
  PayrollTotals,
  PurchaseOrderAmounts,
  PurchaseOrderAmountTotals,
  UseSummaryReturn,
} from "../types";

const toAmountsByCurrency = (
  amounts?: PurchaseOrderAmountTotals,
): AmountsByCurrency => ({
  PEN: amounts?.totalPEN ?? 0,
  USD: amounts?.totalUSD ?? 0,
  EUR: amounts?.totalEUR ?? 0,
});

export function useSummary(): UseSummaryReturn {
  const { can } = useAccess();
  const finance = can("finance.view");
  const { id: projectId } = useParams<{ id: string }>();

  // Currency state
  const [currency, setCurrency] = useState<Currency>("PEN");

  // Date states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // API calls
  const {
    data: project,
    loading,
    error,
  } = useFetch<Project>(`${projectApi}${projectId}`, [projectId]);

  const { data: pettyCashPEN, loading: pettyCashLoading } = useFetch<number>(
    finance && can("cash.view") ? `${pettyCashApi}sum/${projectId}` : "",
    [projectId],
  );

  const { data: purchaseOrderSaleAmounts, loading: purchaseOrderSaleLoading } =
    useFetch<PurchaseOrderAmounts>(
      finance && can("orders.view")
        ? `${purchaseOrderApi}saleAmounts/${projectId}?currency=${currency}`
        : "",
      [projectId, currency],
    );

  const {
    data: purchaseOrderPurchaseAmounts,
    loading: purchaseOrderPurchaseLoading,
  } = useFetch<PurchaseOrderAmounts>(
    finance && can("orders.view")
      ? `${purchaseOrderApi}purchaseAmounts/${projectId}?currency=${currency}`
      : "",
    [projectId, currency],
  );

  const { data: payrollTotals, loading: payrollTotalsLoading } =
    useFetch<PayrollTotals>(
      finance && can("payroll.view")
        ? `${generalPayrollApi}projects/${projectId}/totals`
        : "",
      [projectId],
    );

  const { data: registeredIncomeTotalsData, loading: serviceSaleLoading } =
    useFetch<AmountsByCurrency>(
      finance && can("incomes.view")
        ? `${serviceSaleApi}project/${projectId}/totals`
        : "",
      [projectId],
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

  const purchaseOrdersSaleTotals = toAmountsByCurrency(
    purchaseOrderSaleAmounts ?? undefined,
  );

  const purchaseOrdersPurchaseTotals = toAmountsByCurrency(
    purchaseOrderPurchaseAmounts ?? undefined,
  );

  const purchaseOrdersSaleTotalsByType = {
    materials: toAmountsByCurrency(purchaseOrderSaleAmounts?.byType?.materials),
    services: toAmountsByCurrency(purchaseOrderSaleAmounts?.byType?.services),
  };

  const purchaseOrdersPurchaseTotalsByType = {
    materials: toAmountsByCurrency(
      purchaseOrderPurchaseAmounts?.byType?.materials,
    ),
    services: toAmountsByCurrency(
      purchaseOrderPurchaseAmounts?.byType?.services,
    ),
  };

  const registeredIncomeTotals: AmountsByCurrency = {
    PEN: registeredIncomeTotalsData?.PEN ?? 0,
    USD: registeredIncomeTotalsData?.USD ?? 0,
    EUR: registeredIncomeTotalsData?.EUR ?? 0,
  };

  const utilitiesTotals = {
    PEN:
      purchaseOrdersSaleTotals.PEN +
      registeredIncomeTotals.PEN -
      (purchaseOrdersPurchaseTotals.PEN +
        pettyCashTotals.PEN +
        payrollTotalsAmounts.PEN || 0),
    USD:
      purchaseOrdersSaleTotals.USD +
      registeredIncomeTotals.USD -
      (purchaseOrdersPurchaseTotals.USD +
        pettyCashTotals.USD +
        payrollTotalsAmounts.USD || 0),
    EUR:
      purchaseOrdersSaleTotals.EUR +
      registeredIncomeTotals.EUR -
      (purchaseOrdersPurchaseTotals.EUR +
        pettyCashTotals.EUR +
        payrollTotalsAmounts.EUR || 0),
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
    serviceSaleLoading,

    // Calculated totals
    pettyCashTotals,
    payrollTotalsAmounts,
    purchaseOrdersSaleTotals,
    purchaseOrdersPurchaseTotals,
    purchaseOrdersSaleTotalsByType,
    purchaseOrdersPurchaseTotalsByType,
    registeredIncomeTotals,
    utilitiesTotals,
  };
}
