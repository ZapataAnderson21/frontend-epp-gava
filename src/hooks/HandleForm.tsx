import { useApiAction } from "./useApiAction";
import type {
  ElementType,
  CreateElementRequestDto,
  ElementRequestType,
  UpdateElementRequestDto,
  Worker,
  RequestWorker,
} from "../data/types";
import {
  requestApi,
  elementRequestApi,
  workerApi,
  requestWorkerApi,
} from "../data/apiUrl";

function getTypeFromElements(elements: any[]) {
  console.log("getTypeFromElements: elements ->", elements);
  const types = elements.map((el: any) => el.type);
  const hasSecurity = types.includes("EPP");
  const hasOperative = types.includes("Operativo");

  console.log("getTypeFromElements: hasSecurity =", hasSecurity, ", hasOperative =", hasOperative);

  if (hasSecurity && hasOperative) return "eppAndOperative";
  if (hasSecurity) return "epp";
  if (hasOperative) return "operative";
  return "";
}

export function useHandleForm() {
  console.log("useHandleForm: Hook initialized");

  const { execute: createRequest } = useApiAction<any>();
  const { execute: updateRequest } = useApiAction<any>();
  const { execute: sendRequestToLogistics } = useApiAction<any>();
  const { execute: createElementRequest } = useApiAction<any>();
  const { execute: updateElementRequest } = useApiAction<any>();
  const { execute: createRequestWorker } = useApiAction<any>();

  // 🟩 Guardar nueva solicitud
  const handleSave = async (projectId: number, deliveryDueDate: string, description?: string) => {
    console.log("handleSave: START", { projectId, deliveryDueDate, description });

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const selectedElements = JSON.parse(localStorage.getItem("selectedElements") || "[]");
    const selectedElementRequest = JSON.parse(localStorage.getItem("selectedElementRequest") || "[]");
    const selectedWorkers: Worker[] = JSON.parse(localStorage.getItem("selectedWorkers") || "[]");
    const selectedRequestWorkers: RequestWorker[] = JSON.parse(localStorage.getItem("selectedRequestWorkers") || "[]");

    console.log("handleSave: user =", user);
    console.log("handleSave: selectedElements =", selectedElements);
    console.log("handleSave: selectedElementRequest =", selectedElementRequest);

    const type = getTypeFromElements(selectedElements);
    console.log("handleSave: computed type =", type);

    const requestData = {
      userId: Number(user.userId),
      projectId,
      deliveryDueDate,
      description,
      type,
    };
    console.log("handleSave: requestData =", requestData);

    const response = await createRequest(`${requestApi}`, "POST", requestData);
    console.log("handleSave: createRequest response =", response);

    if (!response || response.statusCode !== 201) {
      console.error("handleSave: Error creating request:", response?.message || "Unknown error");
      return {
        loading: false,
        error: response?.message || "Unknown error",
        data: null,
      };
    }

    const requestId = response.data.requestId;
    console.log("handleSave: requestId =", requestId);

    const elementRequests: CreateElementRequestDto[] = selectedElementRequest.map((el: any) => ({
      quantityRequested: el.quantityRequested,
      unit: el.unit,
      elementId: el.elementId,
      requestId,
    }));
    console.log("handleSave: elementRequests to create =", elementRequests);

    const elementResponses = await Promise.all(
      elementRequests.map((el) => createElementRequest(`${elementRequestApi}`, "POST", el))
    ).catch((error) => {
      console.error("handleSave: Error creating element requests:", error);
      return {
        loading: false,
        error: error.message || "Unknown error",
        data: null,
      };
    });

    console.log("handleSave: elementResponses =", elementResponses);


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
        console.error("handleSave: Error creating request workers:", err);
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
    console.log("handleSave: LocalStorage cleaned up");

    console.log("handleSave: SUCCESS", {
      request: response.data,
      elements: Array.isArray(elementResponses) && elementResponses[0]?.data,
    });

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

  // 🟩 Enviar a logística
  const handleSend = async (requestId: number, passwordCPanel: string) => {
    console.log("handleSend: START", { requestId, passwordCPanel });

    if (!passwordCPanel) {
      console.warn("handleSend: Missing passwordCPanel");
      throw new Error("La contraseña del panel de control es requerida.");
    }

    const response = await sendRequestToLogistics(
      `${requestApi}sendLogistics`,
      "POST",
      { requestId, passwordCPanel }
    );

    console.log("handleSend: response =", response);

    if (response.statusCode !== 200) {
      console.error("handleSend: Failed with message:", response.message);
      throw new Error(response.message);
    }

    console.log("handleSend: SUCCESS", response.data);
    return response.data;
  };

  // 🟩 Guardar y enviar
  const handleSaveAndSend = async (
    projectId: number,
    deliveryDueDate: string,
    description?: string,
    passwordCPanel?: string
  ) => {
    console.log("handleSaveAndSend: START", { projectId, deliveryDueDate, description, passwordCPanel });

    if (!passwordCPanel) {
      console.warn("handleSaveAndSend: Missing passwordCPanel");
      throw new Error("La contraseña del panel de control es requerida.");
    }

    const result = await handleSave(projectId, deliveryDueDate, description);
    console.log("handleSaveAndSend: handleSave result =", result);

    if (!result?.data) {
      console.error("handleSaveAndSend: Error saving request");
      throw new Error("Error al guardar la solicitud.");
    }

    console.log("handleSaveAndSend: Sending to logistics with requestId =", result.data.request.requestId);
    const sendResult = await handleSend(result.data.request.requestId, passwordCPanel);

    console.log("handleSaveAndSend: SUCCESS", sendResult);
    return sendResult;
  };

  // 🟩 Actualizar solicitud existente
  const handleUpdate = async (
    requestId: number,
    projectId: number,
    selectedElementRequests: ElementRequestType[],
    description?: string
  ) => {
    console.log("handleUpdate: START", { requestId, projectId, description });
    console.log("handleUpdate: selectedElementRequests =", selectedElementRequests);

    const selectedElements: ElementType[] = selectedElementRequests
      .map((el: ElementRequestType) => el.element)
      .filter((el): el is ElementType => el !== undefined);
    console.log("handleUpdate: selectedElements =", selectedElements);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    console.log("handleUpdate: user =", user);

    const requestData = {
      userId: Number(user.userId),
      projectId,
      description,
      status: "draft",
      type: getTypeFromElements(selectedElements),
    };
    console.log("handleUpdate: requestData =", requestData);

    const response = await updateRequest(`${requestApi}${requestId}`, "PATCH", requestData);
    console.log("handleUpdate: updateRequest response =", response);

    if (!response || response.statusCode !== 200) {
      console.error("handleUpdate: Error updating request:", response?.message || "Unknown error");
      return null;
    }

    const elementRequests: UpdateElementRequestDto[] = selectedElementRequests.map((el: ElementRequestType) => ({
      elementRequestId: el.elementRequestId,
      quantityRequested: el.quantityRequested,
      unit: el.unit,
      elementId: el.elementId,
      requestId,
    }));
    console.log("handleUpdate: elementRequests to update =", elementRequests);

    const elementResponses = await Promise.all(
      elementRequests
        .filter((el) => el.elementRequestId !== undefined)
        .map((el) =>
          updateElementRequest(
            `${elementRequestApi}${el.elementRequestId}`,
            "PATCH",
            {
              quantityRequested: el.quantityRequested,
              unit: el.unit,
              elementId: el.elementId,
              requestId,
            }
          )
        )
    );

    console.log("handleUpdate: elementResponses =", elementResponses);

    localStorage.removeItem("selectedElements");
    localStorage.removeItem("selectedElementRequest");
    console.log("handleUpdate: LocalStorage cleaned up");

    console.log("handleUpdate: SUCCESS", {
      request: response.data,
      elements: elementResponses,
    });

    return {
      request: response.data,
      elements: elementResponses,
    };
  };

  // 🟩 Actualizar y enviar
  const handleUpdateAndSend = async (
    requestId: number,
    projectId: number,
    selectedElementRequests: ElementRequestType[],
    passwordCPanel: string,
    description?: string
  ) => {
    console.log("handleUpdateAndSend: START", {
      requestId,
      projectId,
      description,
      passwordCPanel,
    });

    const updateResult = await handleUpdate(requestId, projectId, selectedElementRequests, description);
    console.log("handleUpdateAndSend: handleUpdate result =", updateResult);

    if (!updateResult) {
      console.error("handleUpdateAndSend: Error updating request");
      throw new Error("Error al actualizar la solicitud.");
    }

    const sendResult = await handleSend(requestId, passwordCPanel);
    console.log("handleUpdateAndSend: SUCCESS", sendResult);
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
