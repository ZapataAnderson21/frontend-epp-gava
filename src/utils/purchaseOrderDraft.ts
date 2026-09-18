import { FormDraftStore } from "./formDraft";
export type { DraftStatus } from "./formDraft";
import type { ItemRow } from "../hooks/usePurchaseOrderForm";

export interface PurchaseOrderDraftData {
  schemaVersion: 1;
  code: string;
  supplierId: number;
  quotation: string;
  destination: string;
  deliveryLocation: string;
  carePerson: string;
  dniCarePerson: string;
  observations: string;
  paymentMethod: string;
  paymentConditions: string;
  paymentConditions1: string;
  paymentConditions2: string;
  purchaseOrderType: string;
  generalConditions: string[];
  qualityConditions: string[];
  items: ItemRow[];
  rpoIds: (number | null)[];
}

export function isPurchaseOrderDraft(
  value: unknown,
): value is PurchaseOrderDraftData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  const strings = [
    "code",
    "quotation",
    "destination",
    "deliveryLocation",
    "carePerson",
    "dniCarePerson",
    "observations",
    "paymentMethod",
    "paymentConditions",
    "paymentConditions1",
    "paymentConditions2",
    "purchaseOrderType",
  ];
  return (
    data.schemaVersion === 1 &&
    typeof data.supplierId === "number" &&
    strings.every((key) => typeof data[key] === "string") &&
    ["generalConditions", "qualityConditions"].every(
      (key) =>
        Array.isArray(data[key]) &&
        data[key].every((item) => typeof item === "string"),
    ) &&
    Array.isArray(data.rpoIds) &&
    data.rpoIds.every((id) => id === null || Number.isInteger(id)) &&
    Array.isArray(data.items) &&
    data.items.every(
      (item) =>
        item &&
        typeof item === "object" &&
        [
          "description",
          "unit",
          "quantity",
          "unitPurchasePrice",
          "unitSalesPrice",
        ].every((key) => typeof item[key] === "string") &&
        ["resourceId", "orderNumber", "subtotal"].every(
          (key) => typeof item[key] === "number",
        ),
    )
  );
}

export class PurchaseOrderDraftStore extends FormDraftStore<PurchaseOrderDraftData> {
  constructor(
    key: string,
    url: string,
    initial: PurchaseOrderDraftData,
    restore: (value: PurchaseOrderDraftData) => void,
    notify: () => void,
    storage: Pick<Storage, "getItem" | "setItem">,
    request: typeof fetch = fetch,
  ) {
    super(
      key,
      url,
      initial,
      restore,
      notify,
      storage,
      request,
      isPurchaseOrderDraft,
    );
  }
}
