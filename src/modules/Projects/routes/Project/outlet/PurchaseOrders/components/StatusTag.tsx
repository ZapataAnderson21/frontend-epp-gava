import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface StatusTagProps {
  status: string;
  onStatusChange?: (newStatus: string) => void;
  editable?: boolean;
}

export const statusColor = {
  "Pendiente": "#f59e0b",
  "Autorizada": "#10b981",
  "Entregada": "#3b82f6",
  "Cancelada": "#ef4444",
};

export const statusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "authorized", label: "Autorizada" },
  { value: "delivered", label: "Entregada" },
  { value: "cancelled", label: "Cancelada" },
];

export default function StatusTag({ status, onStatusChange, editable = false }: StatusTagProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const tagRef = useRef<HTMLSpanElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calcular posición del dropdown
  useEffect(() => {
    if (isOpen && tagRef.current) {
      const rect = tagRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        tagRef.current && !tagRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cerrar dropdown al hacer scroll
  useEffect(() => {
    const handleScroll = () => setIsOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const handleStatusClick = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
    setIsOpen(false);
  };

  if (!editable) {
    return (
      <span 
        className="px-2 py-1 rounded-full text-white font-semibold text-sm"
        style={{ backgroundColor: statusColor[status as keyof typeof statusColor] || '#9ca3af' }}
      >
        {status.toUpperCase()}
      </span>
    );
  }

  return (
    <>
      <span 
        ref={tagRef}
        className="px-2 py-1 rounded-full text-white font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity"
        style={{ backgroundColor: statusColor[status as keyof typeof statusColor] || '#9ca3af' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {status.toUpperCase()} ▾
      </span>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] w-36 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          style={{ 
            top: dropdownPosition.top, 
            left: dropdownPosition.left,
          }}
        >
          {statusOptions.map((option) => (
            <div
              key={option.value}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2 transition-colors"
              onClick={() => handleStatusClick(option.value)}
            >
              <span 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: statusColor[option.label as keyof typeof statusColor] }}
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}