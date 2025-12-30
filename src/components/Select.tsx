import { IoMdArrowDropdown } from "react-icons/io";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Primitive = string | number;

export interface Option<T extends Primitive = string> {
  value: T;
  label: string;
}

interface SelectProps<T extends Primitive = string> {
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  error?: boolean;
  placeholder?: string;
  openDurationMs?: number;
  staggerMs?: number;
  disabled?: boolean;
}

export default function Select<T extends Primitive = string>({
  name,
  value,
  onChange,
  options,
  error,
  placeholder = "Seleccionar ...",
  openDurationMs = 200,
  staggerMs = 30,
  disabled = false,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Variantes del contenedor (dropdown)
  const dropdownVariants = {
    collapsed: {
      opacity: 0,
      height: 0,
      transition: {
        when: "afterChildren",
        duration: openDurationMs / 1000,
      },
    },
    open: {
      opacity: 1,
      height: "auto",
      transition: {
        when: "beforeChildren",
        duration: openDurationMs / 1000,
        staggerChildren: staggerMs / 1000,
      },
    },
  };

  // Variantes para cada opción
  const optionVariants = {
    hidden: { opacity: 0, y: -6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.16 } },
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((v) => !v)}
        disabled={disabled}
        className={`w-full flex items-center justify-between border cursor-pointer ${error ? "border-red-500" : "border-gray-400"} min-w-[180px] p-2 rounded-sm focus:border focus:border-[#0047a3] ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${name}-menu`}
      >
        {selectedLabel || placeholder}
        <IoMdArrowDropdown
          className={`ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown animado */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`${name}-menu`}
            role="listbox"
            key="dropdown"
            className="absolute top-full left-0 z-200 w-full bg-white border border-gray-200 rounded-md shadow-md overflow-hidden max-h-72 overflow-y-auto"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={dropdownVariants}
          >
            {/* Opciones con stagger */}
            {options.map((option) => (
              <motion.div
                key={String(option.value)}
                role="option"
                aria-selected={value === option.value}
                variants={optionVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 hover:bg-[#eff2ff] hover:text-[#0047a3] cursor-pointer ${
                  value === option.value ? "bg-[#eff2ff] font-semibold text-[#0047a3]" : ""
                }`}
              >
                <span>{option.label}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
