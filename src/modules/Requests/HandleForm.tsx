import { fetchCreateRequest, fetchSendRequestToLogistics, fetchUpdateRequest } from "../../data/requestData";
import { fetchCreateElementRequest, fetchUpdateElementRequest } from "../../data/elementRequestData";
import type { ElementType, CreateElementRequestDto, ElementRequestType, UpdateElementRequestDto } from "../../data/types";

function getTypeFromElements(elements: any[]) {
  const types = elements.map((el: any) => el.type);
  const hasSecurity = types.includes("security");
  const hasOperative = types.includes("operative");

  if (hasSecurity && hasOperative) return "operative_and_security";
  if (hasSecurity) return "security";
  if (hasOperative) return "operative";
  return "";
}

export async function handleSave(project_id: number, delivery_due_date: string, description?: string): Promise<any> {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const selectedElements = JSON.parse(localStorage.getItem("selectedElements") || "[]");
  const selectedElementRequest = JSON.parse(localStorage.getItem("selectedElementRequest") || "[]");

  if (project_id === 0) {
    alert("Por favor, seleccione un proyecto antes de continuar.");
    return;
  }

  const type = getTypeFromElements(selectedElements);

  const requestData = {
    user_id: Number(user.user_id),
    project_id,
    delivery_due_date,
    description,
    type,
  };

  const response = await fetchCreateRequest(requestData);
  if (!response || response.statusCode !== 201) {
    console.error("Error creating request:", response?.message || "Unknown error");
    return null;
  }

  const request_id = response.data.request_id;

  const elementRequests: CreateElementRequestDto[] = selectedElementRequest.map((el: any) => ({
    quantity_requested: el.quantity_requested,
    unit: el.unit,
    element_id: el.element_id,
    request_id,
  }));

  const elementResponses = await Promise.all(
    elementRequests.map((el) => fetchCreateElementRequest(el))
  );

  localStorage.removeItem("selectedElements");
  localStorage.removeItem("selectedElementRequest");

  return {
    request: response.data,
    elements: elementResponses,
  };
}

export async function handleSend(request_id: number, passwordCPanel: string): Promise<any> {
  if (!passwordCPanel) {
    throw new Error("La contraseña del panel de control es requerida.");
  }

  const response = await fetchSendRequestToLogistics(request_id, passwordCPanel);
  if (response.statusCode !== 200) {
    throw new Error(response.message);
  }

  return response.data;
}

export async function handleSaveAndSend(project_id: number, delivery_due_date: string, description?: string, passwordCPanel?: string): Promise<any> {
  if (!passwordCPanel) {
    throw new Error("La contraseña del panel de control es requerida.");
  }

  const result = await handleSave(project_id, delivery_due_date, description);
  if (!result) {
    throw new Error("Error al guardar la solicitud.");
  }

  return await handleSend(result.request.request_id, passwordCPanel);
}

export async function handleUpdate(request_id: number, project_id: number, selectedElementRequests: ElementRequestType[], description?: string): Promise<any> {

  console.log("SELECTED ELEMENT REQUESTS:", selectedElementRequests);

  const selectedElements: ElementType[] = selectedElementRequests
    .map((el: ElementRequestType) => el.element)
    .filter((el): el is ElementType => el !== undefined);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (project_id === 0) {
    alert("Por favor, seleccione un proyecto antes de continuar.");
    return;
  }

  const requestData = {
    user_id: Number(user.user_id),
    project_id,
    description,
    status: "draft",
    type: getTypeFromElements(selectedElements),
  };

  const response = await fetchUpdateRequest(request_id, requestData);
  if (!response || response.statusCode !== 200) {
    console.error("Error updating request:", response?.message || "Unknown error");
    return null;
  }

  const elementRequests: UpdateElementRequestDto[] = selectedElementRequests.map((el: ElementRequestType) => ({
    element_request_id: el.element_request_id,
    quantity_requested: el.quantity_requested,
    unit: el.unit,
    element_id: el.element_id,
    request_id,
  }));

  const elementResponses = await Promise.all(
    elementRequests
      .filter((el) => el.element_request_id !== undefined)
      .map((el) => fetchUpdateElementRequest(el.element_request_id as number, el))
  );

  localStorage.removeItem("selectedElements");
  localStorage.removeItem("selectedElementRequest");

  return {
    request: response.data,
    elements: elementResponses,
  };
}

export async function handleUpdateAndSend(request_id: number, project_id: number, selectedElementRequests: ElementRequestType[], passwordCPanel: string, description?: string): Promise<any> {

  const updateResult = await handleUpdate(request_id, project_id, selectedElementRequests, description);
  if (!updateResult) {
    throw new Error("Error al actualizar la solicitud.");
  }

  return await handleSend(request_id, passwordCPanel);
}
