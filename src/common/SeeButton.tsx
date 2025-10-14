// common/SeeButton.tsx — condicional
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaEye } from "react-icons/fa6";

interface SeeButtonProps {
  to?: string;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}

export default function SeeButton({ to, onClick, title = "Ver", disabled }: SeeButtonProps) {
  
  const cls = "cursor-pointer flex gap-2 justify-center items-center border p-3 rounded-xl border-gray-100 bg-slate-800 hover:bg-black text-white w-fit hover:scale-[105%] duration-300 disabled:opacity-60";

  if (to) {
    return (
      <Link to={to} aria-label={title} title={title}>
        <motion.button type="button" className={cls} disabled={disabled}>
          <FaEye />
        </motion.button>
      </Link>
    );
  }

  return (
    <motion.button type="button" onClick={onClick} className={cls} aria-label={title} title={title} disabled={disabled}>
      <FaEye />
    </motion.button>
  );
}
