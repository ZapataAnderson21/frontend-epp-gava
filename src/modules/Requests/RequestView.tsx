import { useEffect, useState } from "react";
import type {
  ElementRequestType,
  ElementType,
  FallProtectionGroupType,
  OfficeInventoryEntry,
  RequestResponseType,
  RequestType,
} from "../../data/types";

import { FaArrowRight, FaCheck } from "react-icons/fa6";
import { FaTimes, FaFilePdf } from "react-icons/fa";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";

import Button from "../../components/Button";
import ContentTableSummary from "./components/TableSummary/ContentTableSummary";
import ErrorMessage from "../../common/error/ErrorMessage";
import toast, { Toaster } from "react-hot-toast";

import { elementApi, elementRequestApi, inventoryApi, requestApi, requestResponseApi, elementRequestResponseApi } from "../../data/apiUrl";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction } from "../../hooks/useApiAction";
import { AddButton, ReturnButton } from "../../common/button";
import Permission from "../../common/auth/Permission";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { adminTypes, gerencyTypes, logisticsTypes } from "../../utils";
import { ButtonContainer } from "../../common/form";
import Select from "../../components/Select";
import { getInventoryBackendPayload, type InventoryFamilyTabKey } from "../Elements/inventoryCatalog";
import { requestFamilyTabs } from "./requestFamilies";
import { getRequestLineFamily } from "./requestLineUtils";

interface RequestViewProps {
  requestId: number;
}

function isFallProtectionGroupPickerItem(
  item: ElementType | FallProtectionGroupType,
): item is FallProtectionGroupType {
  return "harnessElementId" in item && "fallProtectionGroupId" in item;
}

function isElementPickerItem(
  item: ElementType | FallProtectionGroupType,
): item is ElementType {
  return "elementId" in item;
}

type OfficeInventoryPayload =
  | OfficeInventoryEntry[]
  | {
      entries?: OfficeInventoryEntry[];
      items?: OfficeInventoryEntry[];
      data?: OfficeInventoryEntry[];
    };

function normalizeOfficeEntries(payload?: OfficeInventoryPayload | null) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.entries)) return payload.entries;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export default function RequestView({ requestId }: RequestViewProps) {
  const { user, loading: loadingUser } = useCurrentUser();
  const [adminDescription, setAdminDescription] = useState("");
  const [managementDescription, setManagementDescription] = useState("");
  const [logisticsDescription, setLogisticsDescription] = useState("");
  const [acceptedQuantities, setAcceptedQuantities] = useState<{ [key: number]: number }>({});
  const [selectedSafetyElementIds, setSelectedSafetyElementIds] = useState<{ [key: number]: number[] }>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [elementRequests, setElementRequests] = useState<ElementRequestType[]>([]);
  const [isAddRowOpen, setIsAddRowOpen] = useState(false);
  const [newElementFamily, setNewElementFamily] = useState<InventoryFamilyTabKey>("epp");
  const [newElementId, setNewElementId] = useState<number>(0);
  const [newUnit, setNewUnit] = useState("");
  const [newQuantity, setNewQuantity] = useState<number>(1);

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const projectId = searchParams.get("projectId");
  
  // Detectar si venimos de la página del proyecto
  const cameFromProject = location.state?.fromProject as number | undefined;

  const navigate = useNavigate();

  // ✅ useFetch para traer la Request
  const { data: request, loading: loadingRequest, error: errorRequest } = useFetch<RequestType>(
    `${requestApi}${requestId}`,
    [requestId]
  );

  const { data: fallProtectionGroupsForRequest } = useFetch<FallProtectionGroupType[]>(
    `${elementApi}fall-protection-groups`,
    [requestId]
  );
  const { data: safetyElements } = useFetch<ElementType[]>(
    `${elementApi}family/ese`,
    [requestId],
  );
  const { data: officeInventoryPayload } = useFetch<OfficeInventoryPayload>(
    `${inventoryApi}office`,
    [requestId],
  );

  const backendFamilyPayload = getInventoryBackendPayload(newElementFamily);
  const elementPickerUrl =
    newElementFamily === "harness"
      ? `${elementApi}fall-protection-groups`
      : `${elementApi}family/${backendFamilyPayload.family}`;
  const { data: elementsByType, loading: loadingElements, error: errorElements } = useFetch<Array<ElementType | FallProtectionGroupType>>(
    elementPickerUrl,
    [elementPickerUrl]
  );

  // ✅ useFetch para traer la RequestResponse
  const { data: requestResponse } = useFetch<RequestResponseType>(
    `${requestResponseApi}request/${requestId}`,
    [requestId]
  );

  // Roles (coherentes con Permission/user.userType)
  const adminOnlyTypes = adminTypes.filter((t) => !gerencyTypes.includes(t));
  const logisticsOnlyTypes = logisticsTypes.filter((t) => !adminTypes.includes(t));
  const isRequestResponsible = !!user && request?.userId === user.userId;

  // Estados (derivados de la request)
  const isInProgress = request?.status === "En progreso";
  const isReviewed = request?.status === "Revisada";
  const isApproved = request?.status === "Aprobada";
  const isAddressed = request?.status === "Atendida";

  // ✅ useApiAction para POST y PATCH
  const { execute: createRequestResponse } = useApiAction<any>();
  const { execute: updateRequestResponse } = useApiAction<any>();
  const { execute: createElementRequestResponse } = useApiAction<any>();
  const { execute: updateElementRequestResponse } = useApiAction<any>();
  const { execute: updateRequestStatus } = useApiAction<any>();
  const { execute: createElementRequest } = useApiAction<any>();

  useEffect(() => {
    if (request?.elementRequests) {
      const groups = fallProtectionGroupsForRequest || [];
      setElementRequests(
        request.elementRequests.map((line) => {
          if (line.fallProtectionGroup || !line.elementId) return line;

          const inferredGroup = groups.find((group) =>
            [
              group.harnessElementId,
              group.anchorBandElementId,
              group.lifelineElementId,
              group.positioningLanyardElementId,
            ].includes(line.elementId),
          );

          if (!inferredGroup) return line;

          return {
            ...line,
            fallProtectionGroupId: inferredGroup.fallProtectionGroupId,
            fallProtectionGroup: inferredGroup,
          };
        }),
      );
    }
  }, [request, fallProtectionGroupsForRequest]);

  useEffect(() => {
    if (!request?.elementRequests) return;

    const nextQuantities: { [key: number]: number } = {};
    const nextSafetySelections: { [key: number]: number[] } = {};

    request.elementRequests.forEach((line) => {
      if (typeof line.elementRequestId !== "number") return;

      const responseLine = line.elementRequestResponses?.[0];
      const family = getRequestLineFamily(line);

      if (family === "ese") {
        nextSafetySelections[line.elementRequestId] =
          responseLine?.selectedElementIds || [];
        nextQuantities[line.elementRequestId] =
          responseLine?.selectedElementIds?.length ??
          responseLine?.quantityAccepted ??
          0;
        return;
      }

      if (family === "harness") {
        nextQuantities[line.elementRequestId] =
          responseLine?.quantityAccepted ?? 1;
        return;
      }

      nextQuantities[line.elementRequestId] =
        responseLine?.quantityAccepted ?? 0;
    });

    setAcceptedQuantities(nextQuantities);
    setSelectedSafetyElementIds(nextSafetySelections);
  }, [request]);

  // Cargar PDF
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch(`${requestApi}pdf/${requestId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        setPdfUrl(URL.createObjectURL(blob));
      })
      .catch((err) => {
        console.error("Error al cargar el PDF:", err);
      });
  }, [requestId]);

  // (Roles/estado ahora se derivan, no se guardan en estado)

  // Cambiar estado
  const handleChangeStatus = async (newStatus: string) => {
    if (!request) return;
    const payload =
      newStatus === "completed" && user
        ? { status: newStatus, actorUserId: user.userId }
        : { status: newStatus };

    await toast.promise(
      updateRequestStatus(`${requestApi}${request.requestId}/status`, "PATCH", payload),
      {
        loading: "Actualizando estado...",
        success: (result) => {
          setTimeout(() => navigate(0), 1200);
          return result.message || "Estado actualizado exitosamente.";
        },
        error: (err) => err.message || "Error al actualizar el estado.",
      }
    );
  };

  const handleAddElement = () => {
    setIsAddRowOpen(true);
    setNewElementFamily("epp");
    setNewElementId(0);
    setNewUnit("");
    setNewQuantity(1);
  };

  const handleCancelAddElement = () => {
    setIsAddRowOpen(false);
    setNewElementId(0);
    setNewUnit("");
    setNewQuantity(1);
  };

  const handleCreateElementRequest = async () => {
    if (!request) return;
    if (!newElementId) {
      toast.error("Selecciona un elemento.");
      return;
    }

    if (!newUnit.trim()) {
      toast.error("Ingresa la unidad.");
      return;
    }

    if (newQuantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0.");
      return;
    }

    try {
      const selectedItem = (elementsByType || []).find((item) =>
        newElementFamily === "harness"
          ? isFallProtectionGroupPickerItem(item) && item.fallProtectionGroupId === newElementId
          : isElementPickerItem(item) && item.elementId === newElementId,
      );
      const selectedGroup =
        newElementFamily === "harness" && selectedItem && isFallProtectionGroupPickerItem(selectedItem)
          ? selectedItem
          : null;
      const selectedElement =
        selectedItem && isElementPickerItem(selectedItem) ? selectedItem : null;

      const response = await createElementRequest(`${elementRequestApi}`, "POST", {
        elementId: selectedGroup?.harnessElementId ?? selectedElement?.elementId ?? newElementId,
        fallProtectionGroupId: selectedGroup?.fallProtectionGroupId ?? null,
        quantityRequested: newQuantity,
        unit: newUnit.trim(),
        requestId: request.requestId,
      });

      if (response?.statusCode !== 201) {
        throw new Error(response?.message || "No se pudo agregar el elemento.");
      }

      const elementRef = selectedGroup?.harnessElement ?? selectedElement ?? undefined;
      const created: ElementRequestType = {
        ...response.data,
        element: response.data.element ?? elementRef,
        fallProtectionGroup: response.data.fallProtectionGroup ?? selectedGroup ?? null,
      };

      setElementRequests((prev) => [...prev, created]);
      setIsAddRowOpen(false);
      setNewElementId(0);
      setNewUnit("");
      setNewQuantity(1);
    } catch (err: any) {
      toast.error(err?.message || "Error al agregar el elemento.");
    }
  };

  // Revisado
  const getAcceptedQuantityForLine = (
    elementRequest: ElementRequestType,
    family: ReturnType<typeof getRequestLineFamily>,
    selectedElementIds: number[],
  ) => {
    if (family === "ese") {
      return selectedElementIds.length;
    }

    if (family === "harness") {
      return elementRequest.elementRequestId !== undefined
        ? acceptedQuantities[elementRequest.elementRequestId] ??
            elementRequest.elementRequestResponses?.[0]?.quantityAccepted ??
            1
        : 1;
    }

    return elementRequest.elementRequestId !== undefined
      ? acceptedQuantities[elementRequest.elementRequestId] ??
          elementRequest.elementRequestResponses?.[0]?.quantityAccepted ??
          0
      : 0;
  };

  const handleReviewed = async () => {
    if (!user) return;
    await toast.promise(
      (async () => {
        const response = await createRequestResponse(`${requestResponseApi}`, "POST", {
          requestId: Number(requestId),
          responderUserId: Number(user.userId),
          adminDescription: adminDescription || "Solicitud revisada por administración.",
        });

        if (!request) throw new Error("No se encontró la solicitud.");

        for (const elementRequest of request.elementRequests || []) {
          const family = getRequestLineFamily(elementRequest);
          const selectedElementIds =
            elementRequest.elementRequestId !== undefined
              ? selectedSafetyElementIds[elementRequest.elementRequestId] || []
              : [];
          const acceptedQuantity = getAcceptedQuantityForLine(
            elementRequest,
            family,
            selectedElementIds,
          );

          if (elementRequest.elementRequestId !== undefined) {
            await createElementRequestResponse(`${elementRequestResponseApi}`, "POST", {
              elementRequestId: elementRequest.elementRequestId,
              quantityAccepted: acceptedQuantity,
              selectedElementIds: family === "ese" ? selectedElementIds : [],
              requestResponseId: response.data.requestResponseId,
            });
          }
        }

        await updateRequestStatus(`${requestApi}${request.requestId}/status`, "PATCH", { status: "reviewed" });
      })(),
      {
        loading: "Revisando solicitud...",
        success: () => {
          setTimeout(() => navigate(0), 1200);
          return "Solicitud revisada exitosamente.";
        },
        error: (err) => err.message || "Error al revisar la solicitud.",
      }
    );
  };

  const returnAction = () => {
    // Si venimos de la página del proyecto, regresar ahí
    if (cameFromProject) {
      navigate(`/admin/projects/${cameFromProject}/requests`);
    } else if (projectId) {
      // Si hay projectId en query params, ir a la página del proyecto
      navigate(`/admin/projects/${projectId}/requests`);
    } else {
      // Sin proyecto, ir a la lista general
      navigate("/admin/requests");
    }
  }

  // Aprobado
  const handleApproved = async () => {
    if (!user) return;
    await toast.promise(
      (async () => {
        if (!request || !requestResponse) throw new Error("No se encontró la solicitud o respuesta.");

        for (const elementRequest of request.elementRequests || []) {
          const family = getRequestLineFamily(elementRequest);
          const selectedElementIds =
            elementRequest.elementRequestId !== undefined
              ? selectedSafetyElementIds[elementRequest.elementRequestId] || []
              : [];
          const acceptedQuantity = getAcceptedQuantityForLine(
            elementRequest,
            family,
            selectedElementIds,
          );

          if (elementRequest.elementRequestResponses?.length && elementRequest.elementRequestResponses.length > 0) {
            await updateElementRequestResponse(
              `${elementRequestResponseApi}${elementRequest.elementRequestResponses[0].elementRequestResponseId}`,
              "PATCH",
              {
                elementRequestId: elementRequest.elementRequestId,
                quantityAccepted: acceptedQuantity,
                selectedElementIds: family === "ese" ? selectedElementIds : [],
                requestResponseId: requestResponse.requestResponseId,
              }
            );
          }
        }

        await updateRequestResponse(`${requestResponseApi}${requestResponse.requestResponseId}`, "PATCH", {
          requestId: requestResponse.requestId,
          responderUserId: Number(user.userId),
          managementDescription: managementDescription,
        });

        await updateRequestStatus(`${requestApi}${request.requestId}/status`, "PATCH", { status: "approved" });
      })(),
      {
        loading: "Aprobando solicitud...",
        success: () => {
          setTimeout(() => navigate(0), 1200);
          return "Solicitud aprobada exitosamente.";
        },
        error: (err) => err.message || "Error al aprobar la solicitud.",
      }
    );
  };

  // Atendido (logística)
  const handleAttended = async () => {
    if (!user) return;
    await toast.promise(
      (async () => {
        if (!request || !requestResponse) throw new Error("No se encontró la solicitud o respuesta.");

        await updateRequestResponse(`${requestResponseApi}${requestResponse.requestResponseId}`, "PATCH", {
          requestId: requestResponse.requestId,
          responderUserId: Number(user.userId),
          logisticsDescription: logisticsDescription,
        });

        await updateRequestStatus(`${requestApi}${request.requestId}/status`, "PATCH", { status: "addressed" });
      })(),
      {
        loading: "Atendiendo solicitud...",
        success: () => {
          setTimeout(() => navigate(0), 1200);
          return "Solicitud atendida exitosamente.";
        },
        error: (err) => err.message || "Error al atender la solicitud.",
      }
    );
  };

  if (loadingRequest || loadingUser) return <p>Cargando...</p>;
  if (errorRequest) return <ErrorMessage errorMessage={errorRequest} />;
  if (!request) return <ErrorMessage errorMessage="No se encontró la solicitud." />;

  return (
    <>
      <div className="flex flex-col items-start justify-start w-full h-full p-10 text-gray-800 gap-8">
        <div className="flex flex-col items-start justify-start w-full max-w-4xl gap-4 text-gray-800">
          <div className="flex flex-row flex-wrap gap-2 items-start justify-between w-full text-[12px] md:text-[14px]">
            <h1 className="text-2xl font-bold mb-4">SOLICITUD N° {requestId}</h1>
            <div className="flex gap-2">
              {pdfUrl && (
                <button
                  onClick={() => setIsPdfOpen(!isPdfOpen)}
                  className="hidden xl:flex items-center cursor-pointer gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                  type="button"
                >
                  <FaFilePdf />
                  {isPdfOpen ? "Ocultar PDF" : "Ver PDF"}
                </button>
              )}
              <AddButton onClick={handleAddElement} />
              <ReturnButton onClick={returnAction} />
            </div>
          </div>

          {/* Tabla visible para todos */}
          <div className="flex flex-col items-start justify-start w-full">
            <div className="w-full overflow-x-auto pb-1">
              <div className="min-w-[720px]">
                {isAddRowOpen && (
                  <div className="w-full border border-gray-200 rounded-md p-3 bg-gray-50 mt-2">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {requestFamilyTabs.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          className={`rounded-md border px-3 py-1 ${
                            newElementFamily === tab.key
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-gray-300 bg-white text-gray-700"
                          }`}
                          onClick={() => setNewElementFamily(tab.key)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid w-full text-[14px] text-gray-700 gap-1" style={{ gridTemplateColumns: "1fr 144px 112px 112px" }}>
                      <div className="w-full min-w-0">
                        <Select
                          name="newElementId"
                          value={newElementId}
                          onChange={(value) => setNewElementId(Number(value))}
                          options={(elementsByType || [])
                            .filter((item) =>
                              newElementFamily === "harness"
                                ? isFallProtectionGroupPickerItem(item) &&
                                  !elementRequests.some((er) => er.fallProtectionGroupId === item.fallProtectionGroupId)
                                : isElementPickerItem(item) &&
                                  !elementRequests.some((er) => er.elementId === item.elementId)
                            )
                            .map((item) => ({
                              value: isFallProtectionGroupPickerItem(item) ? item.fallProtectionGroupId : item.elementId,
                              label: isFallProtectionGroupPickerItem(item)
                                ? item.code
                                : item.code
                                  ? `${item.name} - ${item.code}`
                                  : item.name,
                            }))}
                          placeholder={loadingElements ? "Cargando..." : "Seleccionar elemento"}
                          disabled={loadingElements || !!errorElements}
                        />
                      </div>
                      <input
                        type="text"
                        className="border-2 border-gray-800 w-full text-center px-3 py-1 rounded-md"
                        placeholder="Unidad"
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                      />
                      <input
                        type="number"
                        className="border-2 border-gray-800 w-full text-center px-3 py-1 rounded-md"
                        placeholder="Cantidad"
                        min={0}
                        step="1"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(Number(e.target.value))}
                      />
                      <input
                        type="number"
                        className="border-2 border-gray-800 w-full text-center px-3 py-1 rounded-md bg-gray-100"
                        value={0}
                        disabled
                      />
                    </div>

                    {errorElements && (
                      <p className="text-red-600 text-sm mt-2">{errorElements}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        icon={<FaCheck />}
                        label="Agregar"
                        onClick={handleCreateElementRequest}
                        bgColor="#008000"
                        bgHoverColor="#0c4a28"
                        type="button"
                        disabled={loadingElements}
                      />
                      <Button
                        icon={<FaTimes />}
                        label="Cancelar"
                        onClick={handleCancelAddElement}
                        bgColor="#d80027"
                        bgHoverColor="#c80008"
                        type="button"
                      />
                    </div>
                  </div>
                )}
                <ContentTableSummary
                  request={request}
                  elementRequests={elementRequests}
                  onQuantityChange={(id, quantity) => setAcceptedQuantities((prev) => ({ ...prev, [id]: quantity }))}
                  onSafetySelectionChange={(id, selectedIds) =>
                    setSelectedSafetyElementIds((prev) => ({
                      ...prev,
                      [id]: selectedIds,
                    }))
                  }
                  safetyElements={safetyElements || []}
                  officeEntries={normalizeOfficeEntries(officeInventoryPayload)}
                />
              </div>
            </div>
          </div>

          {/* Respuestas visibles para todos */}
          {requestResponse?.adminDescription && <p className="text-black"><strong>Respuesta de Administración:</strong> {requestResponse.adminDescription}</p>}
          {requestResponse?.managementDescription && <p className="text-black"><strong>Respuesta de Gerencia:</strong> {requestResponse.managementDescription}</p>}
          {requestResponse?.logisticsDescription && <p className="text-black"><strong>Respuesta de Logística:</strong> {requestResponse.logisticsDescription}</p>}

          {/* Acciones de Admin */}
          <Permission user={user} allow={adminOnlyTypes}>
            {isInProgress && (
              <>
                <textarea
                  className="w-full h-24 p-2 border-2 border-gray-300 rounded-md"
                  placeholder="Comentarios de revisión (opcional)..."
                  value={adminDescription}
                  onChange={(e) => setAdminDescription(e.target.value)}
                ></textarea>
                <ButtonContainer>
                  <Button icon={<FaArrowRight />} label="Revisado" onClick={handleReviewed} bgColor="#f0b100" bgHoverColor="#f69f00" type="button" />
                </ButtonContainer>
              </>
            )}
          </Permission>

          {/* Acciones de Gerencia */}
          <Permission user={user} allow={gerencyTypes}>
            {isReviewed && (
              <>
                <textarea
                  className="w-full h-24 p-2 border-2 border-gray-300 rounded-md"
                  placeholder="Comentarios de aprobación o rechazo..."
                  value={managementDescription}
                  onChange={(e) => setManagementDescription(e.target.value)}
                ></textarea>
                <ButtonContainer>
                  <Button icon={<FaCheck />} label="Aprobar" onClick={handleApproved} bgColor="#008000" bgHoverColor="#0c4a28" type="button" />
                  <Button icon={<FaTimes />} label="Rechazar" onClick={() => handleChangeStatus("rejected")} bgColor="#d80027" bgHoverColor="#c80008" type="button" />
                </ButtonContainer>
              </>
            )}
          </Permission>

          {/* Acciones de Logística */}
          <Permission user={user} allow={logisticsOnlyTypes}>
            {isApproved && (
              <>
                <textarea
                  className="w-full h-24 p-2 border-2 border-gray-300 rounded-md"
                  placeholder="Comentarios de atención (opcional)..."
                  value={logisticsDescription}
                  onChange={(e) => setLogisticsDescription(e.target.value)}
                ></textarea>
                <ButtonContainer>
                  <Button icon={<FaCheck />} label="Atendido" onClick={handleAttended} bgColor="#0047a3" bgHoverColor="#003d8f" type="button" />
                </ButtonContainer>
              </>
            )}
          </Permission>

          {/* Confirmacion final del responsable del requerimiento */}
          {isRequestResponsible && isAddressed && (
            <ButtonContainer>
              <Button
                icon={<FaCheck />}
                label="Confirmar recepcion total"
                onClick={() => handleChangeStatus("completed")}
                bgColor="#ad46ff"
                bgHoverColor="#9b3bff"
                type="button"
              />
            </ButtonContainer>
          )}
        </div>

        {/* Panel del PDF deslizable desde la derecha en pantallas XL */}
        {pdfUrl && (
          <div
            className={`
              fixed top-0 right-0 h-screen w-full xl:w-[50vw] bg-white z-50
              transform transition-transform duration-300 ease-in-out
              shadow-[-8px_0_24px_rgba(0,0,0,0.3)]
              ${isPdfOpen ? 'translate-x-0' : 'translate-x-full'}
            `}
          >
            <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
              <h2 className="text-lg font-bold">Requerimiento PDF</h2>
              <button
                onClick={() => setIsPdfOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                type="button"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            <iframe 
              src={pdfUrl} 
              title="Requerimiento PDF" 
              className="w-full h-[calc(100%-60px)]"
            />
          </div>
        )}

        {/* Overlay para cerrar el PDF en mobile cuando está abierto */}
        {isPdfOpen && pdfUrl && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
            onClick={() => setIsPdfOpen(false)}
          />
        )}
      </div>
      <Toaster position="top-center" />
    </>
  );
}
