import type { Project } from "../../../../../../../data/types";
import type { Currency } from "../../../../../components";

export interface PurchaseOrderAmounts {
  totalPEN: number;
  totalUSD: number;
  totalEUR: number;
}

export interface PayrollTotals {
  laborerAmount: number;
  technicianAmount: number;
  totalAmount: number;
}

export interface AmountsByCurrency {
  PEN: number;
  USD: number;
  EUR: number;
}

export interface UseSummaryReturn {
  // Project data
  project: Project | null;
  projectId: string | undefined;
  loading: boolean;
  error: string | null;
  
  // Dates
  startDate: string;
  endDate: string;
  
  // Currency
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  
  // Loading states
  pettyCashLoading: boolean;
  purchaseOrderSaleLoading: boolean;
  purchaseOrderPurchaseLoading: boolean;
  payrollTotalsLoading: boolean;
  
  // Calculated totals
  pettyCashTotals: AmountsByCurrency;
  payrollTotalsAmounts: AmountsByCurrency;
  purchaseOrdersSaleTotals: AmountsByCurrency;
  purchaseOrdersPurchaseTotals: AmountsByCurrency;
  utilitiesTotals: AmountsByCurrency;
}
