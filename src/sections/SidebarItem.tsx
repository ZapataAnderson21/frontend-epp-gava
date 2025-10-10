// SidebarItem.tsx
import type React from "react";
import { Link } from "react-router-dom";
import { MdOutlineArrowDropDown } from "react-icons/md";
import { motion } from "framer-motion";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;           // si no hay href, será botón
  isRoot?: boolean;
  isOpen?: boolean;
  onClick?: () => void;

  // 👇 animación
  index?: number;          // índice para delay
  baseDelay?: number;      // delay inicial (s)
  perItemDelay?: number;   // delay incremental por ítem (s)
}

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, delay: i }
  }),
};

export default function SidebarItem({
  icon, label, href, isRoot, isOpen, onClick,
  index = 0, baseDelay = 0, perItemDelay = 0.06,
}: SidebarItemProps) {
  const delay = baseDelay + index * perItemDelay;

  const content =
    <div tabIndex={0} className="flex flex-row items-center justify-between gap-4 p-3 hover:bg-[#eff2ff]
                                 hover:text-[#0047a3] hover:shadow-[#c8d1f3] hover:shadow-md focus:bg-[#e0e5f6] focus:text-[#0047a3]
                                 focus:shadow-[#c8d1f3] focus:shadow-sm w-full cursor-pointer rounded-sm transition-colors duration-200">
      <div className="flex flex-row items-center gap-4">
        {icon}
        {label}
      </div>
      {isRoot && (isOpen ? <MdOutlineArrowDropDown className="rotate-180" /> : <MdOutlineArrowDropDown />)}
    </div>;

  // Link animado o botón animado según haya href
  return href ? (
    <motion.div
      custom={delay}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
    >
      <Link className="w-full block" to={href}>{content}</Link>
    </motion.div>
  ) : (
    <motion.button
      type="button"
      onClick={onClick}
      className="w-full text-left"
      custom={delay}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
    >
      {content}
    </motion.button>
  );
}
