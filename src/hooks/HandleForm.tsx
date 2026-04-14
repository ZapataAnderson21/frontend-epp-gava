import { useApiAction } from "./useApiAction";
import type {
  CreateElementRequestDto,
  ElementRequestType,
  ElementRequestWorkerPlan,
  ElementType,
  RequestWorker,
} from "../data/types";
import {
  elementRequestApi,
  elementRequestWorkerPlanApi,
  requestApi,
  requestWorkerApi,
} from "../data/apiUrl";

type ElementPlanState = Record<string, ElementRequestWorkerPlan[]>;

function getTypeFromElements(elements: ElementType[]) {
  const types = elements.map((el: ElementType) => el.type);
  const hasSecurity = types.includes("EPP") || types.includes("epp");
  const hasOperative = types.includes("Operativo") || types.includes("operative");

  if (hasSecurity && hasOperative) return "eppAndOperative";
  if (hasSecurity) return "epp";
  if (hasOperative) return "operative";
  return "";
}

function parseStoredPlans(): ElementPlanState {
  try {
    return JSON.parse(localStorage.getItem("selectedElementRequestPlans") || "{}");
  } catch {
    return {};
  }
}

function isEpiElement(element?: ElementType) {
  if (!element) return false;

  if (element.family) {
    return element.family === "epi";
  }

  return element.type === "epp" && element.controlType === "individual";
}

function buildPlanPayload(
  plans: ElementRequestWorkerPlan[],
  savedRequestWorkers: RequestWorker[],
) {
  const requestWorkerIdByWorkerId = new Map(
    savedRequestWorkers.map((requestWorker) => [
      requestWorker.workerId,
      requestWorker.requestWorkerId,
    ]),
  );

  return plans
    .map((plan) => {
      const workerId = plan.requestWorker?.workerId ?? plan.requestWorkerId;
      const requestWorkerId =
        requestWorkerIdByWorkerId.get(workerId) ?? plan.requestWorkerId;

      return {
        requestWorkerId,
        plannedQuantity: Number(plan.plannedQuantity || 0),
        size: plan.size?.trim() || undefined,
        notes: plan.notes?.trim() || undefined,
      };
    })
    .filter(
      (plan) =>
        Number.isFinite(plan.plannedQuantity) &&
        plan.plannedQuantity > 0 &&
        Number.isFinite(plan.requestWorkerId) &&
        plan.requestWorkerId > 0,
    );
}

function clearRequestDraftStorage() {
  localStorage.removeItem("selectedWorkers");
  localStorage.removeItem("selectedRequestWorkers");
  localStorage.removeItem("selectedElements");
  localStorage.removeItem("selectedElementRequest");
  localStorage.removeItem("selectedElementRequestPlans");
}

export function useHandleForm() {
  const { execute: createRequest } = useApiAction<any>();
  const { execute: updateRequest } = useApiAction<any>();
  const { execute: sendRequestToLogistics } = useApiAction<any>();
  const { execute: createElementRequest } = useApiAction<any>();
  const { execute: updateElementRequest } = useApiAction<any>();
  const { execute: createRequestWorker } = useApiAction<any>();
  const { execute: updateRequestWorker } = useApiAction<any>();
  const { execute: deleteRequestWorker } = useApiAction<any>();
  const { execute: replaceElementRequestWorkerPlans } = useApiAction<any>();

  const syncPlans = async (
    elementRequests: ElementRequestType[],
    savedRequestWorkers: RequestWorker[],
    plansState: ElementPlanState,
  ) => {
    const syncOperations = elementRequests
      .filter(
        (elementRequest) =>
          Boolean(elementRequest.elementRequestId) && isEpiElement(elementRequest.element),
      )
      .map(async (elementRequest) => {
        const sourcePlans = plansState[String(elementRequest.elementId)] || [];
        const plansPayload = buildPlanPayload(sourcePlans, savedRequestWorkers);

        await replaceElementRequestWorkerPlans(
          `${elementRequestWorkerPlanApi}element-request/${elementRequest.elementRequestId}`,
          "PUT",
          { plans: plansPayload },
        );
      });

    await Promise.all(syncOperations);
  };

  const saveRequestWorkers = async (
    requestId: number,
    selectedRequestWorkers: RequestWorker[],
  ) => {
    if (!selectedRequestWorkers.length) {
      return [] as RequestWorker[];
    }

    const responses = await Promise.all(
      selectedRequestWorkers.map((requestWorker) =>
        createRequestWorker(`${requestWorkerApi}`, "POST", {
          requestId,
          workerId: requestWorker.workerId,
          shoeSize: requestWorker.shoeSize ?? null,
          pantsSize: requestWorker.pantsSize ?? null,
          shirtSize: requestWorker.shirtSize ?? null,
        }),
      ),
    );

    return responses.map((response, index) => ({
      ...(response.data as RequestWorker),
      worker: response.data?.worker ?? selectedRequestWorkers[index].worker,
    }));
  };

  const upsertRequestWorkers = async (
    requestId: number,
    selectedRequestWorkers: RequestWorker[],
    existingRequestWorkers: RequestWorker[] = [],
  ) => {
    const selectedWorkerIds = new Set(
      (selectedRequestWorkers || []).map((requestWorker) => requestWorker.workerId),
    );

    const removedRequestWorkers = (existingRequestWorkers || []).filter(
      (requestWorker) =>
        Boolean(requestWorker.requestWorkerId) &&
        !selectedWorkerIds.has(requestWorker.workerId),
    );

    await Promise.all(
      removedRequestWorkers.map((requestWorker) =>
        deleteRequestWorker(
          `${requestWorkerApi}${requestWorker.requestWorkerId}`,
          "DELETE",
        ),
      ),
    );

    if (!selectedRequestWorkers.length) {
      return [] as RequestWorker[];
    }

    const responses = await Promise.all(
      (selectedRequestWorkers || []).map((requestWorker) => {
        const body = {
          requestId,
          workerId: requestWorker.workerId,
          shoeSize: requestWorker.shoeSize ?? null,
          pantsSize: requestWorker.pantsSize ?? null,
          shirtSize: requestWorker.shirtSize ?? null,
        };

        if (requestWorker.requestWorkerId) {
          return updateRequestWorker(
            `${requestWorkerApi}${requestWorker.requestWorkerId}`,
            "PATCH",
            body,
          );
        }

        return createRequestWorker(`${requestWorkerApi}`, "POST", body);
      }),
    );

    return responses.map((response, index) => ({
      ...(response.data as RequestWorker),
      worker: response.data?.worker ?? selectedRequestWorkers[index].worker,
    }));
  };

  const upsertElementRequests = async (
    requestId: number,
    selectedElementRequests: ElementRequestType[],
  ) => {
    const responses = await Promise.all(
      selectedElementRequests.map((elementRequest) => {
        const payload = {
          quantityRequested: Number(elementRequest.quantityRequested || 0),
          unit: elementRequest.unit,
          elementId: elementRequest.elementId,
          requestId,
        };

        if (elementRequest.elementRequestId) {
          return updateElementRequest(
            `${elementRequestApi}${elementRequest.elementRequestId}`,
            "PATCH",
            payload,
          );
        }

        const createPayload: CreateElementRequestDto = {
          quantityRequested: Number(elementRequest.quantityRequested || 0),
          unit: elementRequest.unit ?? "",
          elementId: elementRequest.elementId,
          requestId,
        };

        return createElementRequest(`${elementRequestApi}`, "POST", createPayload);
      }),
    );

    return responses.map((response, index) => ({
      ...(response.data as ElementRequestType),
      element: response.data?.element ?? selectedElementRequests[index].element,
      epiPlans:
        response.data?.epiPlans ??
        selectedElementRequests[index].epiPlans ??
        [],
    }));
  };

  const handleSave = async (
    projectId: number,
    deliveryDueDate: string,
    description?: string,
  ) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const selectedElements: ElementType[] = JSON.parse(
      localStorage.getItem("selectedElements") || "[]",
    );
    const selectedElementRequest: ElementRequestType[] = JSON.parse(
      localStorage.getItem("selectedElementRequest") || "[]",
    );
    const selectedRequestWorkers: RequestWorker[] = JSON.parse(
      localStorage.getItem("selectedRequestWorkers") || "[]",
    );
    const selectedElementRequestPlans = parseStoredPlans();

    const type = getTypeFromElements(selectedElements);
    const requestData = {
      userId: Number(user.userId),
      projectId,
      deliveryDueDate,
      description,
      type,
    };

    const response = await createRequest(`${requestApi}`, "POST", requestData);
    if (!response || response.statusCode !== 201) {
      return {
        loading: false,
        error: response?.message || "Unknown error",
        data: null,
      };
    }

    const requestId = response.data.requestId;
    const savedRequestWorkers = await saveRequestWorkers(
      requestId,
      selectedRequestWorkers,
    );
    const savedElementRequests = await upsertElementRequests(
      requestId,
      selectedElementRequest,
    );

    await syncPlans(
      savedElementRequests,
      savedRequestWorkers,
      selectedElementRequestPlans,
    );

    clearRequestDraftStorage();

    return {
      loading: false,
      error: false,
      data: {
        request: response.data,
        elements: savedElementRequests,
        workers: savedRequestWorkers,
      },
    };
  };

  const handleSend = async (requestId: number, passwordCPanel: string) => {
    if (!passwordCPanel) {
      throw new Error("La contraseña del panel de control es requerida.");
    }

    const response = await sendRequestToLogistics(`${requestApi}sendLogistics`, "POST", {
      requestId,
      passwordCPanel,
    });

    if (response.statusCode !== 200) {
      throw new Error(response.message);
    }

    return response.data;
  };

  const handleSaveAndSend = async (
    projectId: number,
    deliveryDueDate: string,
    description?: string,
    passwordCPanel?: string,
  ) => {
    if (!passwordCPanel) {
      throw new Error("La contraseña del panel de control es requerida.");
    }

    const result = await handleSave(projectId, deliveryDueDate, description);
    if (!result?.data) {
      throw new Error("Error al guardar la solicitud.");
    }

    return await handleSend(result.data.request.requestId, passwordCPanel);
  };

  const handleUpdate = async (
    requestId: number,
    projectId: number,
    selectedElementRequests: ElementRequestType[],
    deliveryDueDate: string,
    description: string,
    selectedRequestWorkers: RequestWorker[] = [],
    existingRequestWorkers: RequestWorker[] = [],
    selectedElementRequestPlans: ElementPlanState = parseStoredPlans(),
  ) => {
    const selectedElements: ElementType[] = selectedElementRequests
      .map((elementRequest) => elementRequest.element)
      .filter((element): element is ElementType => Boolean(element));

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const requestData = {
      userId: Number(user.userId),
      projectId,
      description,
      deliveryDueDate,
      status: "draft",
      type: getTypeFromElements(selectedElements),
    };

    const response = await updateRequest(`${requestApi}${requestId}`, "PATCH", requestData);
    if (!response || response.statusCode !== 200) {
      return null;
    }

    const savedRequestWorkers = await upsertRequestWorkers(
      requestId,
      selectedRequestWorkers,
      existingRequestWorkers,
    );
    const savedElementRequests = await upsertElementRequests(
      requestId,
      selectedElementRequests,
    );

    await syncPlans(
      savedElementRequests,
      savedRequestWorkers,
      selectedElementRequestPlans,
    );

    return {
      loading: false,
      error: false,
      data: {
        request: response.data,
        elements: savedElementRequests,
        workers: savedRequestWorkers,
      },
    };
  };

  const handleUpdateAndSend = async (
    requestId: number,
    projectId: number,
    selectedElementRequests: ElementRequestType[],
    passwordCPanel: string,
    deliveryDueDate: string,
    description: string,
    selectedRequestWorkers: RequestWorker[] = [],
    existingRequestWorkers: RequestWorker[] = [],
    selectedElementRequestPlans: ElementPlanState = parseStoredPlans(),
  ) => {
    const updateResult = await handleUpdate(
      requestId,
      projectId,
      selectedElementRequests,
      deliveryDueDate,
      description,
      selectedRequestWorkers,
      existingRequestWorkers,
      selectedElementRequestPlans,
    );

    if (!updateResult) {
      throw new Error("Error al actualizar la solicitud.");
    }

    clearRequestDraftStorage();
    return await handleSend(requestId, passwordCPanel);
  };

  return {
    handleSave,
    handleSend,
    handleSaveAndSend,
    handleUpdate,
    handleUpdateAndSend,
  };
}
