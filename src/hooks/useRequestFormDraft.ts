import { root } from "../data/apiUrl";
import {
  isRequestFormDraft,
  type RequestFormDraftData,
} from "../utils/requestFormDraft";
import { useFormDraft } from "./useFormDraft";

export function useRequestFormDraft({
  userId,
  slot,
  enabled = true,
  value,
  restore,
}: {
  userId?: number;
  slot: string;
  enabled?: boolean;
  value: RequestFormDraftData;
  restore: (data: RequestFormDraftData) => void;
}) {
  return useFormDraft({
    storageKey: `gava:request-form-draft:v1:${userId}:${slot}`,
    url: `${root}request-form-draft/${slot}`,
    enabled: enabled && Boolean(userId),
    value,
    restore,
    validate: isRequestFormDraft,
  });
}
