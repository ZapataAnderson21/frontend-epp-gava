import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaEye } from "react-icons/fa6";
import StatCard from "./StatCard";

interface CountCardProps {
  title: string;
  count: number;
  to: string;
  label?: string;
}

export default function CountCard({ title, count, to, label = "Ver" }: CountCardProps) {
  return (
    <StatCard
      title={title}
      right={
        <>
          <p className="text-4xl font-extrabold">{count}</p>
          <Link to={to} className="text-sm text-white">
            <motion.button className="flex flex-row gap-2 justify-center items-center border p-3 rounded-xl border-gray-100 bg-slate-800 hover:bg-black w-fit hover:scale-[105%] duration-300 cursor-pointer">
              <span>{label}</span> <FaEye />
            </motion.button>
          </Link>
        </>
      }
    />
  );
}
