import { ChevronDown as IoMdArrowDropdown } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
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
  className?: string;
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
  className = "",
  error,
  placeholder = "Seleccionar ...",
  openDurationMs = 200,
  staggerMs = 30,
  disabled = false,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isSearchEnabled = options.length > 10;
  const filteredOptions = useMemo(() => {
    if (!isSearchEnabled || !searchTerm.trim()) return options;

    const normalizedSearch = searchTerm
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase();

    return options.filter(option =>
      option.label
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase()
        .includes(normalizedSearch),
    );
  }, [isSearchEnabled, options, searchTerm]);

  const closeSelect = () => {
    setIsOpen(false);
    setSearchTerm("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
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
    <div
      className={`relative w-full min-w-[14rem] max-w-full ${className}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          if (isOpen) setSearchTerm("");
          setIsOpen(current => !current);
        }}
        disabled={disabled}
        className={`w-full flex items-center justify-between border cursor-pointer ${error ? "border-red-500" : "border-gray-400"} p-2 rounded-sm focus:border focus:border-[#0047a3] ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`}
        title={selectedLabel || placeholder}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${name}-menu`}
      >
        <span className="block min-w-0 flex-1 truncate text-left">
          {selectedLabel || placeholder}
        </span>
        <IoMdArrowDropdown
          className={`ml-2 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown animado */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`${name}-menu`}
            role="listbox"
            key="dropdown"
            className="absolute top-full left-0 z-200 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-72 overflow-auto"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={dropdownVariants}
          >
            {isSearchEnabled && (
              <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-2">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Escape") closeSelect();
                  }}
                  placeholder="Buscar..."
                  aria-label={`Buscar en ${name}`}
                  autoFocus
                  className="w-full rounded-sm border border-gray-400 px-3 py-2 outline-none focus:border-[#0047a3]"
                />
              </div>
            )}

            {/* Opciones con stagger */}
            {filteredOptions.map((option) => (
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
                  closeSelect();
                }}
                title={option.label}
                className={`min-w-0 px-3 py-2 hover:bg-[#eff2ff] hover:text-[#0047a3] cursor-pointer ${
                  value === option.value ? "bg-[#eff2ff] font-semibold text-[#0047a3]" : ""
                }`}
              >
                <span className="block truncate">{option.label}</span>
              </motion.div>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-gray-500">
                No se encontraron opciones.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
