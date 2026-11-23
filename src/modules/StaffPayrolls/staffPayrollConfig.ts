import type { WorkerTypeValue } from "../../data/types";

export const STAFF_TYPE_LABELS: Record<WorkerTypeValue, string> = {
  laborer: "Obrero",
  technician: "Técnico",
  engineer: "Ingeniero",
  administrator: "Administrador(a)",
  manager: "Gerente",
};

export const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export function periodLabel(year: number, month: number) {
  return (MONTH_LABELS[month - 1] ?? month) + " " + year;
}

export function formatPen(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}
