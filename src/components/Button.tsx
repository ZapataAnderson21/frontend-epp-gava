// components/Button.tsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface ButtonProps {
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;                 // 👈 opcional
  bgColor: string;
  bgHoverColor: string;
}

function Button({ icon, label, onClick, href, bgColor, bgHoverColor }: ButtonProps) {
  const Btn = (
    <motion.button
      type="button"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{ backgroundColor: bgColor }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = bgHoverColor)}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = bgColor)}
      className="cursor-pointer px-4 py-2 rounded-md shadow-sm transition-colors font-bold flex flex-row gap-2 items-center text-white"
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );

  return href ? (
    <Link className="w-full" to={href}>{Btn}</Link>
  ) : (
    Btn
  );
}
export default Button;
