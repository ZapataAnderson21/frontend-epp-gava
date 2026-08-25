import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { QuotationStatus } from "../../../data/types";

interface StatusTagProps {
  status: QuotationStatus;
  onStatusChange?: (newStatus: QuotationStatus) => void;
  editable?: boolean;
}

const statusLabel: Record<QuotationStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  approved: "Aprobada",
  accepted: "Aceptada",
};

const statusColor: Record<QuotationStatus, string> = {
  draft: "#6b7280",
  sent: "#2563eb",
  approved: "#d97706",
  accepted: "#059669",
};

export const statusOptions: { value: QuotationStatus; label: string }[] = [
  { value: "draft", label: "Borrador" },
  { value: "sent", label: "Enviada" },
  { value: "approved", label: "Aprobada" },
  { value: "accepted", label: "Aceptada" },
];

export default function StatusTag({ status, onStatusChange, editable = false }: StatusTagProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const tagRef = useRef<HTMLSpanElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && tagRef.current) {
      const rect = tagRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        tagRef.current &&
        !tagRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const handleStatusClick = (newStatus: QuotationStatus) => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
    setIsOpen(false);
  };

  if (!editable) {
    return (
      <span
        className="px-2 py-1 rounded-full text-white font-semibold text-xs"
        style={{ backgroundColor: statusColor[status] }}
      >
        {statusLabel[status].toUpperCase()}
      </span>
    );
  }

  return (
    <>
      <span
        ref={tagRef}
        className="px-2 py-1 rounded-full text-white font-semibold text-xs cursor-pointer hover:opacity-80 transition-opacity"
        style={{ backgroundColor: statusColor[status] }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {statusLabel[status].toUpperCase()} ▾
      </span>

      {isOpen &&
        createPortal(
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
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor[option.value] }} />
                <span className="text-xs text-gray-700">{option.label}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
