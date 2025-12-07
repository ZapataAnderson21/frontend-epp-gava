import { motion } from "framer-motion";

interface ActionButtonProps {
  icon: React.ReactNode;
  bgColor: string;
  bgHoverColor: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function ActionButton({ icon, onClick, disabled, bgColor, bgHoverColor }: ActionButtonProps) {
  return (
    <motion.button 
      onClick={onClick}
      type="button"
      style={{ backgroundColor: bgColor }}
      className={`cursor-pointer flex gap-2 justify-center items-center border p-2 rounded-xl 
          border-gray-100 text-white w-fit 
          hover:scale-[105%] duration-300 disabled:opacity-60`}
      whileHover={{ backgroundColor: bgHoverColor }}
      disabled={disabled}>
      {icon}
    </motion.button>
  );
}
