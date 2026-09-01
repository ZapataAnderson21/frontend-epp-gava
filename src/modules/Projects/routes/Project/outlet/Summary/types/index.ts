import type { Project, Currency } from "../../../../../../../data/types";

export interface PurchaseOrderAmountTotals {
  totalPEN: number;
  totalUSD: number;
  totalEUR: number;
}

export interface PurchaseOrderAmounts extends PurchaseOrderAmountTotals {
  byType?: {
    materials: PurchaseOrderAmountTotals;
    services: PurchaseOrderAmountTotals;
  };
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

export interface AmountsByPurchaseOrderType {
  materials: AmountsByCurrency;
  services: AmountsByCurrency;
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
  serviceSaleLoading: boolean;
  
  // Calculated totals
  pettyCashTotals: AmountsByCurrency;
  payrollTotalsAmounts: AmountsByCurrency;
  purchaseOrdersSaleTotals: AmountsByCurrency;
  purchaseOrdersPurchaseTotals: AmountsByCurrency;
  purchaseOrdersSaleTotalsByType: AmountsByPurchaseOrderType;
  purchaseOrdersPurchaseTotalsByType: AmountsByPurchaseOrderType;
  registeredIncomeTotals: AmountsByCurrency;
  utilitiesTotals: AmountsByCurrency;
}
