import { useApiAction } from "./useApiAction";
import type {
  ElementType,
  CreateElementRequestDto,
  ElementRequestType,
  UpdateElementRequestDto,
} from "../data/types";
import {
  requestApi,
  elementRequestApi,
} from "../data/apiUrl";

function getTypeFromElements(elements: any[]) {
  const types = elements.map((el: any) => el.type);
  const hasSecurity = types.includes("epp");
  const hasOperative = types.includes("operative");

  if (hasSecurity && hasOperative) return "eppAndOperative";
  if (hasSecurity) return "epp";
  if (hasOperative) return "operative";
  return "";
}

// ✅ Custom hook que encapsula los handlers
export function useHandleForm() {
  const { execute: createRequest } = useApiAction<any>();
  const { execute: updateRequest } = useApiAction<any>();
  const { execute: sendRequestToLogistics } = useApiAction<any>();
  const { execute: createElementRequest } = useApiAction<any>();
  const { execute: updateElementRequest } = useApiAction<any>();

  // Guardar nueva solicitud
  const handleSave = async (projectId: number, deliveryDueDate: string, description?: string) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const selectedElements = JSON.parse(localStorage.getItem("selectedElements") || "[]");
    const selectedElementRequest = JSON.parse(localStorage.getItem("selectedElementRequest") || "[]");

    if (projectId === 0) {
      alert("Por favor, seleccione un proyecto antes de continuar.");
      return;
    }

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
      console.error("Error creating request:", response?.message || "Unknown error");
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
      console.error("Error creating element requests:", error);
      return {
        loading: false,
        error: error.message || "Unknown error",
        data: null,
      };
    });

    localStorage.removeItem("selectedElements");
    localStorage.removeItem("selectedElementRequest");

    console.log("Request: ")
    console.log(response.data)
    console.log("Elements: ")
    console.log(Array.isArray(elementResponses) && elementResponses[0]?.data)
    return {
      loading: false,
      error: false,
      data: {
        request: response.data,
        elements: Array.isArray(elementResponses) && elementResponses.length > 0 ? elementResponses[0].data : null,
      },
    };
  };

  // Enviar a logística
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

  // Guardar y enviar
  const handleSaveAndSend = async (projectId: number, deliveryDueDate: string, description?: string, passwordCPanel?: string) => {
    if (!passwordCPanel) {
      throw new Error("La contraseña del panel de control es requerida.");
    }

    const result = await handleSave(projectId, deliveryDueDate, description);
    if (!result?.data) {
      throw new Error("Error al guardar la solicitud.");
    }

    console.log("Result data: ", result.data.request.requestId);

    return await handleSend(result.data.request.requestId, passwordCPanel);
  };

  // Actualizar solicitud existente
  const handleUpdate = async (requestId: number, projectId: number, selectedElementRequests: ElementRequestType[], description?: string) => {
    const selectedElements: ElementType[] = selectedElementRequests
      .map((el: ElementRequestType) => el.element)
      .filter((el): el is ElementType => el !== undefined);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (projectId === 0) {
      alert("Por favor, seleccione un proyecto antes de continuar.");
      return;
    }

    const requestData = {
      userId: Number(user.userId),
      projectId,
      description,
      status: "draft",
      type: getTypeFromElements(selectedElements),
    };

    const response = await updateRequest(`${requestApi}${requestId}`, "PATCH", requestData);
    if (!response || response.statusCode !== 200) {
      console.error("Error updating request:", response?.message || "Unknown error");
      return null;
    }

    const elementRequests: UpdateElementRequestDto[] = selectedElementRequests.map((el: ElementRequestType) => ({
      elementRequestId: el.elementRequestId,
      quantityRequested: el.quantityRequested,
      unit: el.unit,
      elementId: el.elementId,
      requestId,
    }));

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

    localStorage.removeItem("selectedElements");
    localStorage.removeItem("selectedElementRequest");

    return {
      request: response.data,
      elements: elementResponses,
    };
  };

  // Actualizar y enviar
  const handleUpdateAndSend = async (requestId: number, projectId: number, selectedElementRequests: ElementRequestType[], passwordCPanel: string, description?: string) => {
    const updateResult = await handleUpdate(requestId, projectId, selectedElementRequests, description);
    if (!updateResult) {
      throw new Error("Error al actualizar la solicitud.");
    }

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
