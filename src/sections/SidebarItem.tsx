// SidebarItem.tsx
import type React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown as MdOutlineArrowDropDown } from "lucide-react";
import { motion } from "framer-motion";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;           // si no hay href, será botón
  activePaths?: string[];
  exactActivePaths?: string[];
  isRoot?: boolean;
  isOpen?: boolean;
  onClick?: () => void;

  // 👇 animación
  index?: number;          // índice para delay
  baseDelay?: number;      // delay inicial (s)
  perItemDelay?: number;   // delay incremental por ítem (s)
}

const rowVariants = {
  hidden: { opacity: 0, x: -2.5 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.1, delay: i }
  }),
};

export default function SidebarItem({
  icon, label, href, activePaths = [], exactActivePaths = [], isRoot, isOpen, onClick,
  index = 0, baseDelay = 0, perItemDelay = 0.06,
}: SidebarItemProps) {
  const { pathname } = useLocation();
  const delay = baseDelay + index * perItemDelay;
  const sectionPaths = href ? [href, ...activePaths] : activePaths;
  const isActive = Boolean(href) && (
    sectionPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
    || exactActivePaths.includes(pathname)
  );

  const content =
    <div className={`flex flex-row items-center justify-between gap-2 p-2.5 hover:bg-primary-50 text-sm
                                 hover:text-primary hover:shadow-primary-50 hover:shadow-md focus:bg-primary-50 focus:text-primary
                                 focus:shadow-primary-50 focus:shadow-sm w-full cursor-pointer rounded-lg transition-all duration-200
                                 ${isActive ? "bg-primary-50 text-primary shadow-primary-50 shadow-md font-semibold" : ""}`}>
      <div className="flex flex-row items-center gap-2">
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
      <Link
        className="w-full block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        to={href}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
      >
        {content}
      </Link>
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
