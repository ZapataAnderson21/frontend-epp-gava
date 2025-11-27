import { motion } from "framer-motion";

interface PayrollSummary {
  totalGross: number;
  totalAfp: number;
  totalAdvance: number;
  totalNet: number;
}

interface GeneralPayrollSummaryCardsProps {
  summary: PayrollSummary;
}

export function GeneralPayrollSummaryCards({ summary }: GeneralPayrollSummaryCardsProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 w-full mb-8">
      <SummaryCard title="Monto Bruto" amount={summary.totalGross} color="text-gray-800" />
      <SummaryCard title="Desc. AFP" amount={summary.totalAfp} color="text-orange-600" isDiscount />
      <SummaryCard title="Desc. Adelantos" amount={summary.totalAdvance} color="text-red-600" isDiscount />
      <SummaryCard title="Pago Neto" amount={summary.totalNet} color="text-green-600" />
    </section>
  );
}

interface SummaryCardProps {
  title: string;
  amount: number;
  color?: string;
  isDiscount?: boolean;
}

function SummaryCard({ title, amount, color = "text-gray-800", isDiscount = false }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      style={{
        boxShadow:
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      }}
      className="border border-gray-100 text-lg font-bold p-4 rounded-md col-span-1 flex flex-col gap-2"
    >
      <h4 className="text-xl font-bold text-gray-600">{title}</h4>
      <p className={`flex-1 text-2xl font-extrabold ${color}`}>
        {isDiscount && amount > 0 ? "-" : ""}S/ {amount.toFixed(2)}
      </p>
    </motion.div>
  );
}
