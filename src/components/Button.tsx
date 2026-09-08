import { motion } from "framer-motion";
import React from "react";
import { useAccess } from "../permissions/AccessProvider";

type TypeButton = "button" | "submit" | "reset";

interface ButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  bgColor: string;
  bgHoverColor: string;
  type: TypeButton;
  disabled?: boolean;
  permission?: string;
}

export default function Button({
  icon,
  label,
  onClick,
  bgColor,
  bgHoverColor,
  type,
  disabled,
  permission,
}: ButtonProps) {
  const { can } = useAccess();
  if (permission && !can(permission)) return null;
  return (
    <motion.button
      type={type}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{ backgroundColor: bgColor }}
      onMouseOver={(e) =>
        (e.currentTarget.style.backgroundColor = bgHoverColor)
      }
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = bgColor)}
      className="cursor-pointer px-3 py-2 rounded-lg shadow-sm transition-colors font-bold flex flex-row gap-1 items-center text-white text-nowrap [&_svg]:size-5 [&_svg]:shrink-0"
      disabled={disabled}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}
