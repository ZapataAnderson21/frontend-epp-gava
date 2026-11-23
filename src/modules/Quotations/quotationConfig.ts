import type { QuotationStatus, QuotationType } from "../../data/types";

export const QUOTATION_TYPE_LABELS: Record<QuotationType, string> = {
  works: "Obras",
  services: "Servicios",
  consulting: "Consultorías",
};

export const QUOTATION_TYPE_OPTIONS = (
  Object.entries(QUOTATION_TYPE_LABELS) as Array<[QuotationType, string]>
).map(([value, label]) => ({ value, label }));

export const QUOTATION_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "Todos los tipos" },
  ...QUOTATION_TYPE_OPTIONS,
] as const;

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

export const QUOTATION_STATUS_COLORS: Record<QuotationStatus, string> = {
  draft: "#6b7280",
  sent: "#2563eb",
  accepted: "#059669",
  rejected: "#dc2626",
};

export const QUOTATION_STATUS_OPTIONS = (
  Object.entries(QUOTATION_STATUS_LABELS) as Array<[QuotationStatus, string]>
).map(([value, label]) => ({ value, label }));

export const QUOTATION_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  ...QUOTATION_STATUS_OPTIONS,
] as const;

export function getQuotationTypeLabel(type?: QuotationType | null) {
  return type ? QUOTATION_TYPE_LABELS[type] : "—";
}
