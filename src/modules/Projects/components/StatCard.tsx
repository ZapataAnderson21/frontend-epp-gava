import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  right?: React.ReactNode;
}

const cardClass =
  "border border-gray-100 text-lg font-bold p-4 rounded-md col-span-1 flex flex-col gap-2";

const cardShadow = {
  boxShadow:
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

export default function StatCard({ title, right }: StatCardProps) {
  return (
    <motion.div 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      style={cardShadow} className={cardClass}>
      <h4 className="font-bold">{title}</h4>
      <div className="flex flex-row justify-between gap-4 items-center">{right}</div>
    </motion.div>
  );
}
