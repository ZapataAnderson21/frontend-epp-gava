import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface StatusTagProps {
  status: string;
  onStatusChange?: (newStatus: RequestStatusValue) => void;
  editable?: boolean;
}

export const statusColor = {
  "Borrador": "#9ca3af", // gray-400
  "En progreso": "#d97706", // amber-600
  "Revisada": "#fbbf24", // yellow-600
  "Aprobada": "#16a34a", // green-600
  "Rechazada": "#ef4444", // red-500
  "Atendida": "#06b6d4", // cyan-500
  "Completada": "#3b82f6", // purple-500
};

export type RequestStatusValue =
  | "draft"
  | "inProgress"
  | "reviewed"
  | "approved"
  | "rejected"
  | "addressed"
  | "completed";

export const requestStatusOptions: Array<{
  value: RequestStatusValue;
  label: keyof typeof statusColor;
}> = [
  { value: "draft", label: "Borrador" },
  { value: "inProgress", label: "En progreso" },
  { value: "reviewed", label: "Revisada" },
  { value: "approved", label: "Aprobada" },
  { value: "rejected", label: "Rechazada" },
  { value: "addressed", label: "Atendida" },
  { value: "completed", label: "Completada" },
];

export const requestStatusLabelByValue = requestStatusOptions.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {} as Record<RequestStatusValue, keyof typeof statusColor>,
);

export function normalizeRequestStatusLabel(status: string) {
  return requestStatusLabelByValue[status as RequestStatusValue] || status;
}

export default function StatusTag({
  status,
  onStatusChange,
  editable = false,
}: StatusTagProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const tagRef = useRef<HTMLSpanElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const label = normalizeRequestStatusLabel(status);

  useEffect(() => {
    if (!isOpen || !tagRef.current) return;

    const rect = tagRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    });
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

  if (!editable) {
    return (
      <span
        className="px-2 py-1 rounded-full text-white font-semibold text-sm"
        style={{ backgroundColor: statusColor[label as keyof typeof statusColor] || '#9ca3af' }}
      >
        {label.toUpperCase()}
      </span>
    );
  }

  return (
    <>
      <span
        ref={tagRef}
        className="px-2 py-1 rounded-full text-white font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity"
        style={{ backgroundColor: statusColor[label as keyof typeof statusColor] || '#9ca3af' }}
        onClick={() => setIsOpen((current) => !current)}
      >
        {label.toUpperCase()} v
      </span>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          {requestStatusOptions
            .filter((option) => option.value !== "completed")
            .map((option) => (
              <div
                key={option.value}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2 transition-colors"
                onClick={() => {
                  onStatusChange?.(option.value);
                  setIsOpen(false);
                }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: statusColor[option.label] }}
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </div>
            ))}
        </div>,
        document.body,
      )}
    </>
  );
}
