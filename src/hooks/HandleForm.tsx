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

export interface SendRequestOptions {
  operationId?: string;
  progressUserId?: number;
}

interface SaveRequestOptions {
  clearDraft?: boolean;
}

function getStoredUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return Number(user.userId || user.user_id || user.id || 0) || undefined;
  } catch {
    return undefined;
  }
}

function getTypeFromElements(elements: ElementType[]) {
  const families = elements.map((element) => element.family?.toLowerCase() || "");
  const types = elements.map((element) => element.type?.toLowerCase() || "");
  const hasSecurity =
    families.some((family) =>
      ["epp", "epi", "uniform", "officematerial"].includes(family),
    ) ||
    types.some((type) => ["epp", "epps"].includes(type));
  const hasOperative =
    families.some((family) => ["ese", "harness", "measurement"].includes(family)) ||
    types.some((type) => ["operative", "operativo"].includes(type));

  if (hasSecurity && hasOperative) return "eppAndOperative";
  if (hasSecurity) return "epp";
  if (hasOperative) return "operative";
  return "";
}

function getTypeFromRequestLines(elementRequests: ElementRequestType[]) {
  return getTypeFromElements(
    elementRequests
      .map((elementRequest) => elementRequest.element)
      .filter((element): element is ElementType => Boolean(element)),
  );
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
      selectedElementRequests.map((elementRequest, index) => {
        const payload = {
          quantityRequested: Number(elementRequest.quantityRequested || 0),
          unit: "unidad",
          elementId: elementRequest.elementId,
          elementVariantId: null,
          fallProtectionGroupId: elementRequest.fallProtectionGroupId ?? null,
          lineItemOrder: index + 1,
          notes: elementRequest.notes?.trim() || null,
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
          unit: "unidad",
          elementId: elementRequest.elementId,
          elementVariantId: null,
          fallProtectionGroupId: elementRequest.fallProtectionGroupId ?? null,
          lineItemOrder: index + 1,
          notes: elementRequest.notes?.trim() || null,
          requestId,
        };

        return createElementRequest(`${elementRequestApi}`, "POST", createPayload);
      }),
    );

    return responses.map((response, index) => ({
      ...(response.data as ElementRequestType),
      lineKey: selectedElementRequests[index].lineKey,
      element: response.data?.element ?? selectedElementRequests[index].element,
      elementVariant: null,
      fallProtectionGroup:
        response.data?.fallProtectionGroup ??
        selectedElementRequests[index].fallProtectionGroup ??
        null,
      fallProtectionGroupId:
        response.data?.fallProtectionGroupId ??
        selectedElementRequests[index].fallProtectionGroupId ??
        null,
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
    options: SaveRequestOptions = {},
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

    const type =
      getTypeFromRequestLines(selectedElementRequest) ||
      getTypeFromElements(selectedElements);

    if (!type) {
      throw new Error(
        "Selecciona al menos un elemento de proteccion, equipo de seguridad o grupo EPA antes de guardar.",
      );
    }

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

    if (options.clearDraft !== false) {
      clearRequestDraftStorage();
    }

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

  const handleSend = async (
    requestId: number,
    passwordCPanel: string,
    options: SendRequestOptions = {},
  ) => {
    if (!passwordCPanel) {
      throw new Error("La contraseña del panel de control es requerida.");
    }

    const response = await sendRequestToLogistics(`${requestApi}sendLogistics`, "POST", {
      requestId,
      passwordCPanel,
      operationId: options.operationId,
      progressUserId: options.progressUserId ?? getStoredUserId(),
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
    options: SendRequestOptions = {},
  ) => {
    if (!passwordCPanel) {
      throw new Error("La contraseña del panel de control es requerida.");
    }

    let result: Awaited<ReturnType<typeof handleSave>> | null = null;

    try {
      result = await handleSave(projectId, deliveryDueDate, description, {
        clearDraft: false,
      });
    } catch (error) {
      throw error;
    }

    if (!result?.data) {
      throw new Error("Error al guardar la solicitud.");
    }

    try {
      const sent = await handleSend(
        result.data.request.requestId,
        passwordCPanel,
        options,
      );
      clearRequestDraftStorage();
      return sent;
    } catch (error) {
      clearRequestDraftStorage();
      const message = error instanceof Error ? error.message : "Error desconocido";
      throw new Error(
        `La solicitud N° ${result.data.request.requestId} fue guardada, pero no se pudo enviar por correo. ${message}`,
      );
    }
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
    options: SendRequestOptions = {},
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
    return await handleSend(requestId, passwordCPanel, options);
  };

  return {
    handleSave,
    handleSend,
    handleSaveAndSend,
    handleUpdate,
    handleUpdateAndSend,
  };
}
