import type {
  PurchaseOrderStatus,
  PurchaseOrderType,
} from "../../data/types";

export const PURCHASE_ORDER_TYPE_LABELS: Record<PurchaseOrderType, string> = {
  materials: "Materiales",
  services: "Servicios",
};

export const PURCHASE_ORDER_STATUS_LABELS: Record<
  PurchaseOrderStatus,
  string
> = {
  pending: "Pendiente",
  authorized: "Autorizada",
  delivered: "Entregada",
  cancelled: "Cancelada",
};

export const PURCHASE_ORDER_TYPE_FILTER_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  { value: "materials", label: PURCHASE_ORDER_TYPE_LABELS.materials },
  { value: "services", label: PURCHASE_ORDER_TYPE_LABELS.services },
] as const;

export const PURCHASE_ORDER_STATUS_FILTER_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: PURCHASE_ORDER_STATUS_LABELS.pending },
  { value: "authorized", label: PURCHASE_ORDER_STATUS_LABELS.authorized },
  { value: "delivered", label: PURCHASE_ORDER_STATUS_LABELS.delivered },
  { value: "cancelled", label: PURCHASE_ORDER_STATUS_LABELS.cancelled },
] as const;
