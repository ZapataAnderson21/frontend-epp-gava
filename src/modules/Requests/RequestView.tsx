import { useEffect, useState } from "react";
import type { RequestType } from "../../data/types";

import { FaArrowRight, FaCheck } from "react-icons/fa6";
import { FaTimes, FaFilePdf } from "react-icons/fa";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";

import Button from "../../components/Button";
import HeaderTableSummary from "./components/TableSummary/HeaderTableSummary";
import ContentTableSummary from "./components/TableSummary/ContentTableSummary";
import ErrorMessage from "../../common/error/ErrorMessage";
import toast, { Toaster } from "react-hot-toast";

import { requestApi, requestResponseApi, elementRequestResponseApi } from "../../data/apiUrl";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction } from "../../hooks/useApiAction";
import { ReturnButton } from "../../common/button";
import Permission from "../../common/auth/Permission";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { adminTypes, gerencyTypes, logisticsTypes } from "../../utils";

interface RequestViewProps {
  requestId: number;
}

export default function RequestView({ requestId }: RequestViewProps) {
  const { user, loading: loadingUser } = useCurrentUser();
  const [descriptionResponse, setDescriptionResponse] = useState("");
  const [acceptedQuantities, setAcceptedQuantities] = useState<{ [key: number]: number }>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfOpen, setIsPdfOpen] = useState(false);

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

  // Roles (coherentes con Permission/user.userType)
  const adminOnlyTypes = adminTypes.filter((t) => !gerencyTypes.includes(t));
  const logisticsOnlyTypes = logisticsTypes.filter((t) => !adminTypes.includes(t));
  const isEmployee = !!user && !adminTypes.includes(user.userType) && !logisticsOnlyTypes.includes(user.userType);

  // Estados (derivados de la request)
  const isInProgress = request?.status === "En progreso";
  const isUnderReview = request?.status === "Revisada";
  const isApproved = request?.status === "Aprobada";
  const isAttend = request?.status === "Atendida";

  // ✅ useApiAction para POST y PATCH
  const { execute: createRequestResponse } = useApiAction<any>();
  const { execute: updateRequestResponse } = useApiAction<any>();
  const { execute: createElementRequestResponse } = useApiAction<any>();
  const { execute: updateElementRequestResponse } = useApiAction<any>();
  const { execute: updateRequestStatus } = useApiAction<any>();

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
    await toast.promise(
      updateRequestStatus(`${requestApi}/${request.requestId}/status`, "PATCH", { status: newStatus }),
      {
        loading: "Actualizando estado...",
        success: () => {
          setTimeout(() => navigate(0), 1200);
          return "Estado actualizado exitosamente.";
        },
        error: (err) => err.message || "Error al actualizar el estado.",
      }
    );
  };

  // Revisado
  const handleReviewed = async () => {
    if (!user) return;
    await toast.promise(
      (async () => {
        const response = await createRequestResponse(`${requestResponseApi}`, "POST", {
          requestId: Number(requestId),
          responder_userId: Number(user.userId),
          description: "Solicitud revisada por administración.",
        });

        if (!request) throw new Error("No se encontró la solicitud.");

        for (const elementRequest of request.elementRequests || []) {
          const acceptedQuantity =
            elementRequest.elementRequestId !== undefined
              ? acceptedQuantities[elementRequest.elementRequestId] ?? elementRequest.quantityRequested
              : elementRequest.quantityRequested;

          if (elementRequest.elementRequestId !== undefined) {
            await createElementRequestResponse(`${elementRequestResponseApi}`, "POST", {
              elementRequestId: elementRequest.elementRequestId,
              quantity_accepted: acceptedQuantity,
              requestResponseId: response.data.requestResponseId,
            });
          }
        }

        await updateRequestStatus(`${requestApi}/${request.requestId}/status`, "PATCH", { status: "underReview" });
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
        const response = await fetch(`${requestResponseApi}/request/${requestId}`).then((r) => r.json());

        if (!request || !response?.data) throw new Error("No se encontró la solicitud o respuesta.");

        for (const elementRequest of request.elementRequests || []) {
          const acceptedQuantity =
            elementRequest.elementRequestId !== undefined
              ? acceptedQuantities[elementRequest.elementRequestId] ?? elementRequest.quantityRequested
              : elementRequest.quantityRequested;

          if (elementRequest.elementRequestResponses?.length && elementRequest.elementRequestResponses.length > 0) {
            await updateElementRequestResponse(
              `${elementRequestResponseApi}/${elementRequest.elementRequestResponses[0].elementRequestResponseId}`,
              "PATCH",
              {
                elementRequestId: elementRequest.elementRequestId,
                quantity_accepted: acceptedQuantity,
                requestResponseId: response.data.requestResponseId,
              }
            );
          }
        }

        await updateRequestResponse(`${requestResponseApi}/${response.data.requestResponseId}`, "PATCH", {
          requestId: response.data.requestId,
          responder_userId: Number(user.userId),
          description: descriptionResponse,
        });

        await updateRequestStatus(`${requestApi}/${request.requestId}/status`, "PATCH", { status: "approved" });
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
                  className="hidden xl:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  type="button"
                >
                  <FaFilePdf />
                  {isPdfOpen ? "Ocultar PDF" : "Ver PDF"}
                </button>
              )}
              <ReturnButton onClick={returnAction} />
            </div>
          </div>

          <Permission user={user} allow={adminOnlyTypes}>
            <>
              <p className="mt-4 text-[12px] font-bold">Puedes modificar la cantidad de elementos solicitados:</p>
              <div className="flex flex-col items-start justify-start w-full">
                <HeaderTableSummary />
                <ContentTableSummary
                  request={request}
                  onQuantityChange={(id, quantity) => setAcceptedQuantities((prev) => ({ ...prev, [id]: quantity }))}
                />
              </div>
              {isInProgress && (
                <div className="flex flex-row flex-wrap items-center gap-8 w-full max-w-2xl text-white mt-2">
                  <Button icon={<FaArrowRight />} label="Revisado" onClick={handleReviewed} bgColor="#f0b100" bgHoverColor="#f69f00" type="button" />
                </div>
              )}
            </>
          </Permission>

          <Permission user={user} allow={gerencyTypes}>
            <>
              <p className="mt-1 text-[12px] font-bold">Modifica las cantidades antes de aprobar:</p>
              <div className="flex flex-col items-start justify-start w-full max-w-2xl">
                <HeaderTableSummary />
                <ContentTableSummary
                  request={request}
                  onQuantityChange={(id, quantity) => setAcceptedQuantities((prev) => ({ ...prev, [id]: quantity }))}
                />
              </div>
              <textarea
                className="w-full h-24 p-2 border-2 border-gray-300 rounded-md mt-4"
                placeholder="Comentarios de aprobación o rechazo..."
                value={descriptionResponse}
                onChange={(e) => setDescriptionResponse(e.target.value)}
              ></textarea>
              {isUnderReview && (
                <div className="flex flex-row gap-8 w-full max-w-2xl text-white mt-2">
                  <Button icon={<FaCheck />} label="Aprobar" onClick={handleApproved} bgColor="#008000" bgHoverColor="#0c4a28" type="button" />
                  <Button icon={<FaTimes />} label="Rechazar" onClick={() => handleChangeStatus("rejected")} bgColor="#d80027" bgHoverColor="#c80008" type="button" />
                </div>
              )}
            </>
          </Permission>

          <Permission user={user} allow={logisticsOnlyTypes}>
            <>
              <div className="flex flex-col items-start justify-start w-full max-w-2xl">
                <HeaderTableSummary />
                <ContentTableSummary
                  request={request}
                  onQuantityChange={(id, quantity) => setAcceptedQuantities((prev) => ({ ...prev, [id]: quantity }))}
                />
              </div>
              {isApproved && (
                <div className="flex flex-row gap-8 w-full max-w-2xl text-white mt-2">
                  <Button icon={<FaCheck />} label="Atendido" onClick={() => handleChangeStatus("attended")} bgColor="#0047a3" bgHoverColor="#003d8f" type="button" />
                </div>
              )}
            </>
          </Permission>

          {isEmployee && isAttend && (
            <div className="flex flex-row gap-8 w-full max-w-2xl text-white mt-2">
              <Button icon={<FaCheck />} label="Culminado" onClick={() => handleChangeStatus("completed")} bgColor="#ad46ff" bgHoverColor="#9b3bff" type="button" />
            </div>
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
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
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
