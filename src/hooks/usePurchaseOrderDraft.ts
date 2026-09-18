import { root } from "../data/apiUrl";
import {
  isPurchaseOrderDraft,
  type PurchaseOrderDraftData,
} from "../utils/purchaseOrderDraft";
import { useFormDraft } from "./useFormDraft";
export function usePurchaseOrderDraft({
  userId,
  projectId,
  slot = "new",
  enabled = true,
  value,
  restore,
}: {
  userId?: number;
  projectId: string;
  slot?: string;
  enabled?: boolean;
  value: PurchaseOrderDraftData;
  restore: (value: PurchaseOrderDraftData) => void;
}) {
  return useFormDraft({
    storageKey: `gava:purchase-order-draft:v1:${userId}:${projectId}:${slot}`,
    url: `${root}purchase-order-draft/${projectId}/${slot}`,
    enabled: enabled && Boolean(userId && projectId),
    value,
    restore,
    validate: isPurchaseOrderDraft,
  });
}
