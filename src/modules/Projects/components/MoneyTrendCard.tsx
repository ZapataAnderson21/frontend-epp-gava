// components/MoneyTrendCard.tsx
import { motion } from "framer-motion";
import { CgSpinner } from "react-icons/cg";
import { FaArrowRightArrowLeft, FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";

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

const cardClass =
  "border border-gray-100 text-lg font-bold p-4 rounded-md col-span-1 flex flex-col gap-2";

const cardShadow = {
  boxShadow:
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

interface Props {
  loading: boolean;
  title: string;
  trend: "up" | "down" | "flat";
  /** Montos por moneda, sin conversiones */
  amountsByCurrency: Record<Currency, number>; // { PEN, USD, EUR }
  /** Moneda seleccionada por el filtro superior */
  currency: Currency;
}

export default function MoneyTrendCard({
  loading,
  title,
  trend,
  amountsByCurrency,
  currency,
}: Props) {
  const TrendIcon =
    trend === "up" ? (
      <FaArrowTrendUp className="text-4xl text-green-600" />
    ) : trend === "down" ? (
      <FaArrowTrendDown className="text-4xl text-red-600" />
    ) : (
      <FaArrowRightArrowLeft className="text-4xl text-blue-600" />
    );

  const value: number = amountsByCurrency[currency] ?? 0;
  const displayAmount = formatMoney(value, currency);

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
        <p className="flex-1 text-2xl font-extrabold">
          {loading ? <CgSpinner className="animate-spin" /> : displayAmount}
        </p>
        {TrendIcon}
      </div>
    </motion.div>
  );
}
