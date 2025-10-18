import React from "react";
import { motion } from "framer-motion";

type TypeButton = "button" | "submit" | "reset";

interface ButtonProps {
  icon: React.ReactNode;
  label: string; 
  onClick?: () => void;
  bgColor: string;
  bgHoverColor: string;
  type: TypeButton;
  disabled?: boolean;
}

export default function Button({ icon, label, onClick, bgColor, bgHoverColor, type, disabled }: ButtonProps) {
  return (
    <motion.button
      type={type}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{ backgroundColor: bgColor }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = bgHoverColor)}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = bgColor)}
      className="cursor-pointer px-4 py-2 rounded-md shadow-sm transition-colors font-bold flex flex-row gap-2 items-center text-white text-nowrap"
      disabled={disabled}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}
