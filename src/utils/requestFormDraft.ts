import type {
  ElementRequestType,
  ElementRequestWorkerPlan,
  RequestWorker,
} from "../data/types";
import type { InventoryFamilyTabKey } from "../modules/Elements/inventoryCatalog";
import type { ElementPlanState } from "../modules/Requests/requestPlanning";

export interface RequestFormDraftData {
  schemaVersion: 1;
  createdRequestId: number | null;
  projectId: number;
  deliveryDueDate: string;
  description: string;
  activeFamily: InventoryFamilyTabKey;
  elementRequests: ElementRequestType[];
  requestWorkers: RequestWorker[];
  elementPlans: ElementPlanState;
  pendingPlanning: {
    lineKey: string;
    plans: ElementRequestWorkerPlan[];
  } | null;
}
const record = (v: unknown): v is Record<string, unknown> =>
  Boolean(v && typeof v === "object" && !Array.isArray(v));
const number = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const plans = (v: unknown) =>
  Array.isArray(v) &&
  v.every(
    (p) =>
      record(p) &&
      number(p.plannedQuantity) &&
      number(p.requestWorkerId) &&
      number(p.elementRequestId),
  );
export function isRequestFormDraft(v: unknown): v is RequestFormDraftData {
  return (
    record(v) &&
    v.schemaVersion === 1 &&
    number(v.projectId) &&
    Number(v.projectId) >= 0 &&
    (v.createdRequestId === null ||
      (Number.isInteger(v.createdRequestId) &&
        Number(v.createdRequestId) > 0)) &&
    typeof v.description === "string" &&
    typeof v.deliveryDueDate === "string" &&
    [
      "operative",
      "epp",
      "epi",
      "uniform",
      "ese",
      "harness",
      "officeMaterial",
      "ssomaSupply",
      "quality",
    ].includes(String(v.activeFamily)) &&
    Array.isArray(v.elementRequests) &&
    v.elementRequests.every(
      (line) =>
        record(line) &&
        number(line.elementId) &&
        number(line.quantityRequested) &&
        typeof line.unit === "string" &&
        typeof line.lineKey === "string",
    ) &&
    Array.isArray(v.requestWorkers) &&
    v.requestWorkers.every(
      (worker) =>
        record(worker) &&
        number(worker.workerId) &&
        number(worker.requestWorkerId),
    ) &&
    record(v.elementPlans) &&
    Object.values(v.elementPlans).every(plans) &&
    (v.pendingPlanning === null ||
      (record(v.pendingPlanning) &&
        typeof v.pendingPlanning.lineKey === "string" &&
        plans(v.pendingPlanning.plans)))
  );
}
