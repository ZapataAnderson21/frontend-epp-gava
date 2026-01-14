// components/MoneyTrendCard.tsx
import { CgSpinner } from "react-icons/cg";

export type Currency = "PEN" | "USD" | "EUR";

const CURRENCY_SYMBOL: Record<Currency, string> = {
  PEN: "S/.",
  USD: "$",
  EUR: "€",
};

function formatMoney(value: number, currency: Currency) {
  return `${CURRENCY_SYMBOL[currency]} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface Props {
  index: number;
  loading: boolean;
  title: string;
  trend: "up" | "down" | "flat";
  /** Montos por moneda, sin conversiones */
  amountsByCurrency: Record<Currency, number>; // { PEN, USD, EUR }
  /** Moneda seleccionada por el filtro superior */
  currency: Currency;
}

export default function MoneyTrendCard({
  index,
  loading,
  title,
  amountsByCurrency,
  currency,
}: Props) {
  const value: number = amountsByCurrency[currency] ?? 0;
  const displayAmount = formatMoney(value, currency);

  return (
    <div className="w-full rounded-xl">
      <div className={`flex flex-row justify-between bg-gray-50 p-2  ${index % 2 === 0 ? "bg-sky-50" : "bg-gray-50"}`}>
        <span>{title}</span>
        <span className="font-semibold">{loading ? <CgSpinner className="animate-spin" /> : displayAmount}</span>
      </div>
    </div>
  );
}
