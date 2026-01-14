import { type Currency, CurrencyFilter, MoneyTrendCard } from "../components";
import { SectionProjectSummary } from "../components";

interface AmountsByCurrency {
  PEN: number;
  USD: number;
  EUR: number;
}

interface EconomicSummaryCardProps {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  purchaseOrderSaleLoading: boolean;
  purchaseOrderPurchaseLoading: boolean;
  payrollTotalsLoading: boolean;
  pettyCashLoading: boolean;
  loading: boolean;
  purchaseOrdersSaleTotals: AmountsByCurrency;
  purchaseOrdersPurchaseTotals: AmountsByCurrency;
  payrollTotalsAmounts: AmountsByCurrency;
  pettyCashTotals: AmountsByCurrency;
  utilitiesTotals: AmountsByCurrency;
}

export default function EconomicSummaryCard({
  currency,
  setCurrency,
  purchaseOrderSaleLoading,
  purchaseOrderPurchaseLoading,
  payrollTotalsLoading,
  pettyCashLoading,
  loading,
  purchaseOrdersSaleTotals,
  purchaseOrdersPurchaseTotals,
  payrollTotalsAmounts,
  pettyCashTotals,
  utilitiesTotals,
}: EconomicSummaryCardProps) {
  return (
    <div className="col-span-1">
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
    </div>
  );
}
