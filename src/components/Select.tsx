import { ChevronDown as IoMdArrowDropdown } from "lucide-react";
import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

type Primitive = string | number;

export interface Option<T extends Primitive = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SelectProps<T extends Primitive = string> {
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly Option<T>[];
  className?: string;
  buttonClassName?: string;
  error?: boolean;
  placeholder?: string;
  openDurationMs?: number;
  staggerMs?: number;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  ariaLabel?: string;
  portal?: boolean;
}

export default function Select<T extends Primitive = string>({
  name,
  value,
  onChange,
  options,
  className = "",
  buttonClassName = "",
  error,
  placeholder = "Seleccionar ...",
  openDurationMs = 200,
  staggerMs = 30,
  disabled = false,
  required = false,
  id,
  ariaLabel,
  portal = false,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 320, above: false });
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) {
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

  useLayoutEffect(() => {
    if (!isOpen || !portal) return;
    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const margin = 8;
      const below = Math.max(0, window.innerHeight - rect.bottom - margin);
      const aboveSpace = Math.max(0, rect.top - margin);
      const above = below < 280 && aboveSpace > below;
      const width = Math.min(rect.width, window.innerWidth - margin * 2);
      setPosition({
        left: Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin)),
        top: above ? rect.top - 4 : rect.bottom + 4,
        width,
        maxHeight: Math.min(360, Math.max(0, (above ? aboveSpace : below) - 4)),
        above,
      });
    };
    updatePosition();
    const handleScroll = (event: Event) => {
      if (!menuRef.current?.contains(event.target as Node)) updatePosition();
    };
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);
    const observer = new ResizeObserver(updatePosition);
    if (buttonRef.current) observer.observe(buttonRef.current);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
      observer.disconnect();
    };
  }, [isOpen, portal]);

  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      setSearchTerm("");
      buttonRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
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

  const menu = (
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            ref={menuRef}
            id={`${name}-menu`}
            role="listbox"
            key="dropdown"
            className={`${portal ? "fixed z-[1000] text-left" : "absolute top-full left-0 z-200 w-full max-h-72 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"} overflow-x-hidden overflow-y-auto overscroll-contain bg-white border border-gray-200 rounded-md shadow-md`}
            style={portal ? {
              left: position.left, top: position.top, width: position.width,
              maxHeight: position.maxHeight,
              transform: position.above ? "translateY(-100%)" : undefined,
              scrollbarGutter: "stable",
            } : undefined}
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
                  if (option.disabled || disabled || buttonRef.current?.matches(":disabled") || buttonRef.current?.closest("[inert]")) return;
                  onChange(option.value);
                  closeSelect();
                }}
                title={option.label}
                aria-disabled={option.disabled}
                className={`min-w-0 px-3 py-2 ${option.disabled ? "cursor-not-allowed bg-gray-50 text-gray-400" : "cursor-pointer hover:bg-[#eff2ff] hover:text-[#0047a3]"} ${
                  value === option.value ? "bg-[#eff2ff] font-semibold text-[#0047a3]" : ""
                }`}
              >
                <span className={portal ? "block whitespace-normal break-words" : "block truncate"}>{option.label}</span>
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
  );

  return (
    <div className={`relative w-full min-w-0 max-w-full ${className}`} ref={dropdownRef}>
      <input type="hidden" name={name} value={value} />
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={() => {
          if (disabled) return;
          if (isOpen) setSearchTerm("");
          setIsOpen(current => !current);
        }}
        disabled={disabled}
        className={`w-full min-w-0 flex items-center justify-between border cursor-pointer ${error ? "border-red-500" : "border-gray-400"} p-2 rounded-lg focus:border focus:border-[#0047a3] ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""} ${buttonClassName}`}
        title={selectedLabel || placeholder}
        aria-label={ariaLabel}
        aria-required={required}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${name}-menu`}
      >
        <span className="block min-w-0 flex-1 truncate text-left">{selectedLabel || placeholder}</span>
        <IoMdArrowDropdown className={`ml-2 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {portal ? createPortal(menu, document.body) : menu}
    </div>
  );
}
