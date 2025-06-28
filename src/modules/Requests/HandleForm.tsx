import { fetchCreateRequest, fetchSendRequestToLogistics } from "../../data/requestData";
import { fetchCreateElementRequest, type CreateElementRequestDto } from "../../data/elementRequestData";

const user = JSON.parse(localStorage.getItem("user") || "{}");
const selectedElements = JSON.parse(localStorage.getItem("selectedElements") || "[]");
const selectedElementRequest = JSON.parse(localStorage.getItem("selectedElementRequest") || "[]");

function getTypeFromElements(elements: any[]) {
  const types = elements.map((el: any) => el.type);
  const hasSecurity = types.includes("security");
  const hasOperative = types.includes("operative");

  if (hasSecurity && hasOperative) return "operative and security";
  if (hasSecurity) return "security";
  if (hasOperative) return "operative";
  return "";
}

export async function handleSave(project_id: number, description?: string): Promise<any> {
  if (project_id === 0) {
    window.alert("Por favor, seleccione un proyecto antes de continuar.");
    return;
  }

  const type = getTypeFromElements(selectedElements);

  const requestData = {
    user_id: Number(user.user_id),
    project_id,
    description,
    type,
  };

  const response = await fetchCreateRequest(requestData);

  if (!response || response.statusCode !== 201) {
    console.error("Error creating request:", response?.message || "Unknown error");
    return;
  }

  if (response.statusCode === 201) {
    console.log("Request created successfully:", response.data);
    const elementRequests: CreateElementRequestDto[] = selectedElementRequest.map((el: any) => ({
      quantity_requested: el.quantity,
      unit: el.unit,
      element_id: el.element_id,
      request_id: response.data.request_id,
    }));

    const elementResponses = await Promise.all(
      elementRequests.map((el) => fetchCreateElementRequest(el))
    );

    localStorage.removeItem("selectedElements");
    localStorage.removeItem("selectedElementRequest");

    window.location.href = "/admin/requests";

    return {
      request: response.data,
      elements: elementResponses,
    };
  }
}

export async function handleSaveAndSend(project_id: number, description?: string, passwordCPanel?: string): Promise<any> {

  if (passwordCPanel === undefined || passwordCPanel === null || passwordCPanel === "") {
    return Promise.reject("La contraseña del panel de control es requerida.");
  }
  
  return new Promise(async (resolve, reject) => {
    try {
      const result = await handleSave(project_id, description);
      if (result) {
        const { request } = result;
        const response = await fetchSendRequestToLogistics(request.request_id, passwordCPanel);
        resolve(response);

        window.location.href = "/admin/requests";
      } else {
        reject("Error al guardar la solicitud.");
      }
    } catch (error) {
      reject(error);
    }
  });
};
