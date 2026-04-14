import type {
  ElementRequestType,
  ElementRequestWorkerPlan,
  RequestWorker,
} from "../../data/types";

export type ElementPlanState = Record<string, ElementRequestWorkerPlan[]>;

export function prunePlansByElementRequests(
  plansState: ElementPlanState,
  elementRequests: ElementRequestType[],
) {
  return Object.fromEntries(
    Object.entries(plansState).filter(([elementId]) =>
      elementRequests.some(
        (elementRequest) => String(elementRequest.elementId) === elementId,
      ),
    ),
  ) as ElementPlanState;
}

export function buildRequestWorkersFromPlans(
  plansState: ElementPlanState,
  existingRequestWorkers: RequestWorker[] = [],
) {
  const existingByWorkerId = new Map<number, RequestWorker>(
    existingRequestWorkers
      .filter((requestWorker) => Number.isFinite(requestWorker.workerId))
      .map((requestWorker) => [requestWorker.workerId, requestWorker]),
  );

  const nextWorkers = new Map<number, RequestWorker>();

  Object.values(plansState)
    .flat()
    .forEach((plan) => {
      const workerId = plan.requestWorker?.workerId;
      if (!workerId) return;

      const existing = existingByWorkerId.get(workerId);
      nextWorkers.set(workerId, {
        requestWorkerId:
          plan.requestWorker?.requestWorkerId ||
          existing?.requestWorkerId ||
          0,
        requestId: plan.requestWorker?.requestId || existing?.requestId || 0,
        workerId,
        shirtSize: existing?.shirtSize ?? null,
        pantsSize: existing?.pantsSize ?? null,
        shoeSize: existing?.shoeSize ?? null,
        worker: plan.requestWorker?.worker ?? existing?.worker,
      });
    });

  return Array.from(nextWorkers.values());
}
