import { motion } from "framer-motion";
import { useMemo } from "react";
import { type WorkersPayroll } from "../../data/types";

interface SummaryCardsProps {
  laborers: WorkersPayroll[];
  technicians: WorkersPayroll[];
}

export function SummaryCards({ laborers, technicians }: SummaryCardsProps) {
  const laborerTotal = useMemo(
    () => laborers.reduce((sum, w) => sum + w.attendances * w.dailyWage, 0),
    [laborers]
  );

  const technicianTotal = useMemo(
    () => technicians.reduce((sum, w) => sum + w.attendances * w.dailyWage, 0),
    [technicians]
  );

  const grandTotal = laborerTotal + technicianTotal;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-4 w-full mb-8">
      <SummaryCard title="Obreros" amount={laborerTotal} />
      <SummaryCard title="Técnicos" amount={technicianTotal} />
      <SummaryCard title="Total" amount={grandTotal} />
    </section>
  );
}

interface SummaryCardProps {
  title: string;
  amount: number;
}

function SummaryCard({ title, amount }: SummaryCardProps) {
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
      <h4 className="text-xl font-bold">{title}</h4>
      <p className="flex-1 text-2xl font-extrabold">
        {`S/ ${amount.toFixed(2)}`}
      </p>
    </motion.div>
  );
}