import { IoMdArrowDropdown } from "react-icons/io";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Primitive = string | number;

export interface Option<T extends Primitive = string> {
  value: T;
  label: string;
}

interface SelectFormProps<T extends Primitive = string> {
  label: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  directionRow?: boolean;
  children?: React.ReactNode;

  // Opcionales para animación
  openDurationMs?: number;   // duración abrir/cerrar
  staggerMs?: number;        // separación entre opciones
}

export default function SelectForm<T extends Primitive = string>({
  label,
  name,
  value,
  onChange,
  options,
  directionRow,
  children,
  openDurationMs = 200,
  staggerMs = 30,
}: SelectFormProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

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
    <div className="flex flex-col w-full">
      <div
        className={`flex ${
          directionRow ? "flex-row items-center text-nowrap" : "flex-col"
        } gap-2`}
      >
        <div className="flex flex-row justify-between w-full">
          <label className="text-gray-700 font-bold" htmlFor={name}>
            {label}
          </label>
          {children}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="w-full flex items-center justify-between border border-gray-400 min-w-[180px] p-2 rounded-sm focus:border focus:border-[#0047a3]"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={`${name}-menu`}
          >
            {selectedLabel || "Seleccionar ..."}
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
                className="absolute top-full left-0 z-10 w-full bg-white border border-gray-200 rounded-md shadow-md overflow-hidden"
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
      </div>
    </div>
  );
}
