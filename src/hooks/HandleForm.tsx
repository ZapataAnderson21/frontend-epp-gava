import { useApiAction } from "./useApiAction";
import type {
  ElementType,
  CreateElementRequestDto,
  ElementRequestType,
  UpdateElementRequestDto,
  RequestWorker,
} from "../data/types";
import {
  requestApi,
  elementRequestApi,
  requestWorkerApi,
} from "../data/apiUrl";

function getTypeFromElements(elements: ElementType[]) {
  const types = elements.map((el: ElementType) => el.type);
  const hasSecurity = types.includes("EPP") || types.includes("epp");
  const hasOperative = types.includes("Operativo") || types.includes("operative");

  if (hasSecurity && hasOperative) return "eppAndOperative";
  if (hasSecurity) return "epp";
  if (hasOperative) return "operative";
  return "";
}

export function useHandleForm() {
  const { execute: createRequest } = useApiAction<any>();
  const { execute: updateRequest } = useApiAction<any>();
  const { execute: sendRequestToLogistics } = useApiAction<any>();
  const { execute: createElementRequest } = useApiAction<any>();
  const { execute: updateElementRequest } = useApiAction<any>();
  const { execute: createRequestWorker } = useApiAction<any>();
  const { execute: updateRequestWorker } = useApiAction<any>();
  const { execute: deleteElementRequest } = useApiAction<any>(); // por si lo necesitas externamente
  const { execute: deleteRequestWorker } = useApiAction<any>();  // por si lo necesitas externamente

  // 🟩 Guardar nueva solicitud (sin cambios)
  const handleSave = async (projectId: number, deliveryDueDate: string, description?: string) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const selectedElements = JSON.parse(localStorage.getItem("selectedElements") || "[]");
    const selectedElementRequest = JSON.parse(localStorage.getItem("selectedElementRequest") || "[]");
    const selectedRequestWorkers: RequestWorker[] = JSON.parse(localStorage.getItem("selectedRequestWorkers") || "[]");

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

    const elementRequests: CreateElementRequestDto[] = selectedElementRequest.map((el: any) => ({
      quantityRequested: el.quantityRequested,
      unit: el.unit,
      elementId: el.elementId,
      requestId,
    }));

    const elementResponses = await Promise.all(
      elementRequests.map((el) => createElementRequest(`${elementRequestApi}`, "POST", el))
    ).catch((error) => {
      return {
        loading: false,
        error: error.message || "Unknown error",
        data: null,
      };
    });

    const requestWorkerPayloads = (selectedRequestWorkers || []).map((rw) => ({
      requestId,
      workerId: rw.workerId,
      shoeSize: rw.shoeSize ?? null,
      pantsSize: rw.pantsSize ?? null,
      shirtSize: rw.shirtSize ?? null,
    }));

    let requestWorkerResponses: any[] = [];
    if (requestWorkerPayloads.length > 0) {
      try {
        requestWorkerResponses = await Promise.all(
          requestWorkerPayloads.map((payload) =>
            createRequestWorker(`${requestWorkerApi}`, "POST", payload)
          )
        );
      } catch (err: any) {
        return {
          loading: false,
          error: err?.message || "Unknown error",
          data: null,
        };
      }
    }

    localStorage.removeItem("selectedElements");
    localStorage.removeItem("selectedElementRequest");
    localStorage.removeItem("selectedWorkers");
    localStorage.removeItem("selectedRequestWorkers");

    return {
      loading: false,
      error: false,
      data: {
        request: response.data,
        elements:
          Array.isArray(elementResponses) && elementResponses.length > 0
            ? elementResponses[0].data
            : null,
        workers:
          Array.isArray(requestWorkerResponses) && requestWorkerResponses.length > 0
            ? requestWorkerResponses.map((r) => r.data)
            : [],
      },
    };
  };

  // 🟩 Enviar a logística (sin cambios)
  const handleSend = async (requestId: number, passwordCPanel: string) => {
    if (!passwordCPanel) {
      throw new Error("La contraseña del panel de control es requerida.");
    }

    const response = await sendRequestToLogistics(
      `${requestApi}sendLogistics`,
      "POST",
      { requestId, passwordCPanel }
    );

    if (response.statusCode !== 200) {
      throw new Error(response.message);
    }

    return response.data;
  };

  // 🟩 Guardar y enviar (sin cambios)
  const handleSaveAndSend = async (
    projectId: number,
    deliveryDueDate: string,
    description?: string,
    passwordCPanel?: string
  ) => {
    if (!passwordCPanel) {
      throw new Error("La contraseña del panel de control es requerida.");
    }

    const result = await handleSave(projectId, deliveryDueDate, description);
    if (!result?.data) {
      throw new Error("Error al guardar la solicitud.");
    }

    const sendResult = await handleSend(result.data.request.requestId, passwordCPanel);
    return sendResult;
  };

  // 🟩 Actualizar solicitud existente (CREA/ACTUALIZA ElementRequest y RequestWorker)
  const handleUpdate = async (
    requestId: number,
    projectId: number,
    selectedElementRequests: ElementRequestType[],
    deliveryDueDate: string,
    description: string,
    selectedRequestWorkers: RequestWorker[] = []   // ⬅️ NUEVO parámetro opcional
  ) => {
    // 1) Actualizar la cabecera de la solicitud
    const selectedElements: ElementType[] = selectedElementRequests
      .map((elReq: ElementRequestType) => elReq.element)
      .filter((el): el is ElementType => el !== undefined);

    console.log("Elementos seleccionados para determinar el tipo:", selectedElements);
    console.log("Tipo determinado:", getTypeFromElements(selectedElements));

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
    
    console.log("Respuesta de actualización de solicitud:", response);
    
    if (!response || response.statusCode !== 200) {
      return null;
    }

    // 2) ElementRequest: PATCH si existe, POST si no existe
    const elementUpdateOrCreatePromises = selectedElementRequests.map((er) => {
      const payload: UpdateElementRequestDto = {
        quantityRequested: er.quantityRequested,
        unit: er.unit,
        elementId: er.elementId,
        requestId,
      };

      if (er.elementRequestId) {
        // actualizar
        return updateElementRequest(`${elementRequestApi}${er.elementRequestId}`, "PATCH", payload);
      } else {
        // crear
        const createPayload: CreateElementRequestDto = {
          quantityRequested: er.quantityRequested ?? 0,
          unit: er.unit ?? "",
          elementId: er.elementId,
          requestId,
        };
        return createElementRequest(`${elementRequestApi}`, "POST", createPayload);
      }
    });

    const elementResponses = await Promise.all(elementUpdateOrCreatePromises);

    // 3) RequestWorker: PATCH si existe, POST si no existe
    const workerUpdateOrCreatePromises = (selectedRequestWorkers || []).map((rw) => {
      const body = {
        requestId,
        workerId: rw.workerId,
        shoeSize: rw.shoeSize ?? null,
        pantsSize: rw.pantsSize ?? null,
        shirtSize: rw.shirtSize ?? null,
      };

      if (rw.requestWorkerId) {
        return updateRequestWorker(`${requestWorkerApi}${rw.requestWorkerId}`, "PATCH", body);
      } else {
        return createRequestWorker(`${requestWorkerApi}`, "POST", body);
      }
    });

    const workerResponses = await Promise.all(workerUpdateOrCreatePromises);

    // Nota: los borrados (DELETE) no se manejan aquí; se recomienda hacerlos al “quitar” desde la UI.

    return {
      loading: false,
      error: false,
      data: {
        request: response.data,
        elements: elementResponses,
        workers: workerResponses,
      },
    };
  };

  // 🟩 Actualizar y enviar (acepta workers opcional)
  const handleUpdateAndSend = async (
    requestId: number,
    projectId: number,
    selectedElementRequests: ElementRequestType[],
    passwordCPanel: string,
    deliveryDueDate: string,
    description: string,
    selectedRequestWorkers: RequestWorker[] = []    // ⬅️ NUEVO parámetro opcional
  ) => {
    const updateResult = await handleUpdate(
      requestId,
      projectId,
      selectedElementRequests,
      description,
      deliveryDueDate,
      selectedRequestWorkers
    );

    if (!updateResult) {
      throw new Error("Error al actualizar la solicitud.");
    }

    const sendResult = await handleSend(requestId, passwordCPanel);
    return sendResult;
  };

  return {
    handleSave,
    handleSend,
    handleSaveAndSend,
    handleUpdate,
    handleUpdateAndSend,
  };
}
