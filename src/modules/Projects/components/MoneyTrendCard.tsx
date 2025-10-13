import { motion } from "framer-motion";
import { CgSpinner } from "react-icons/cg";
import { FaArrowRightArrowLeft, FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";

export type Currency = "PEN" | "USD" | "EUR";

const CURRENCY_SYMBOL: Record<Currency, string> = {
  PEN: "S/.",
  USD: "$",
  EUR: "€",
};

// Tasas respecto a PEN (placeholder). Reemplaza con tasas reales del backend si aplica.
export const DEFAULT_RATES: Record<Currency, number> = {
  PEN: 1,
  USD: 0.27,
  EUR: 0.25,
};

function convertFromBase(amountInPen: number, target: Currency, rates: Record<Currency, number>) {
  return amountInPen * (rates[target] ?? 1);
}

function formatMoney(value: number, currency: Currency) {
  return `${CURRENCY_SYMBOL[currency]} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const cardClass =
  "border border-gray-100 text-lg font-bold p-4 rounded-md col-span-1 flex flex-col gap-2";

const cardShadow = {
  boxShadow:
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

interface Props {
  loading: boolean;
  title: string;
  amountPen: number; // base en PEN
  trend: "up" | "down" | "flat";
  currency: Currency;
  rates?: Record<Currency, number>;
}

export default function MoneyTrendCard({
  loading,
  title,
  amountPen,
  trend,
  currency,
  rates = DEFAULT_RATES,
}: Props) {
  const TrendIcon =
    trend === "up" ? (
      <FaArrowTrendUp className="text-4xl text-green-600" />
    ) : trend === "down" ? (
      <FaArrowTrendDown className="text-4xl text-red-600" />
    ) : (
      <FaArrowRightArrowLeft className="text-4xl text-blue-600" />
    );

  const displayAmount = formatMoney(convertFromBase(amountPen, currency, rates), currency);

  return (
    <motion.div 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }} 
      style={cardShadow}
      className={cardClass}
    >
      <h4 className={title === "Órdenes de Compra" || title === "Soles" ? "text-xl" : "font-bold"}>
        {title}
      </h4>
      <div className="flex flex-row flex-wrap text-nowrap justify-between gap-4 items-center">
        <p className="flex-1 text-2xl font-extrabold">{ loading ? <CgSpinner className="animate-spin" /> : displayAmount}</p>
        {TrendIcon}
      </div>
    </motion.div>
  );
}
