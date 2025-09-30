import { useEffect, useState } from "react";
import type { RequestType } from "../../data/types";

import { FaArrowLeft, FaArrowRight, FaCheck } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import Button from "../../components/Button";
import HeaderTableSummary from "./components/TableSummary/HeaderTableSummary";
import ContentTableSummary from "./components/TableSummary/ContentTableSummary";
import SaveModal from "../../common/form/SaveModal";
import ErrorMessage from "../../common/ErrorMessage";

import { requestApi, requestResponseApi, elementRequestResponseApi } from "../../data/apiUrl";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction } from "../../hooks/useApiAction";

interface RequestViewProps {
  request_id: number;
}

export default function RequestView({ request_id }: RequestViewProps) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [isLogistics, setIsLogistics] = useState(false);
  const [isGerency, setIsGerency] = useState(false);
  const [isInProgress, setIsInProgress] = useState(false);
  const [isUnderReview, setIsUnderReview] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isAttend, setIsAttend] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [descriptionResponse, setDescriptionResponse] = useState("");
  const [acceptedQuantities, setAcceptedQuantities] = useState<{ [key: number]: number }>({});
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const navigate = useNavigate();

  // ✅ useFetch para traer la Request
  const { data: request, loading: loadingRequest, error: errorRequest } = useFetch<RequestType>(
    `${requestApi}${request_id}`,
    [request_id]
  );

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

    fetch(`${requestApi}pdf/${request_id}`, {
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
  }, [request_id]);

  // Roles y estado
  useEffect(() => {
    if (!user || !user.userUserTypes) return;

    const userType = user.userUserTypes[0].userType.name;
    if (["GERENTE"].includes(userType)) setIsGerency(true);
    if (["LOGISTICA"].includes(userType)) setIsLogistics(true);
    if (["ADMINISTRADORA"].includes(userType)) setIsAdmin(true);
    if (!["GERENTE", "ADMINISTRADORA", "LOGISTICA"].includes(userType)) setIsEmployee(true);

    if (request?.status === "in_progress") setIsInProgress(true);
    if (request?.status === "under_review") setIsUnderReview(true);
    if (request?.status === "approved") setIsApproved(true);
    if (request?.status === "attended") setIsAttend(true);
  }, [user, request]);

  // Cambiar estado
  const handleChangeStatus = async (newStatus: string) => {
    if (!request) return;
    try {
      await updateRequestStatus(`${requestApi}/${request.request_id}/status`, "PATCH", { status: newStatus });
      navigate(0);
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    }
  };

  // Revisado
  const handleReviewed = async () => {
    try {
      const response = await createRequestResponse(`${requestResponseApi}`, "POST", {
        request_id: Number(request_id),
        responder_user_id: Number(user.user_id),
        description: "Solicitud revisada por administración.",
      });

      if (!request) return;

      for (const elementRequest of request.elementRequests || []) {
        const acceptedQuantity =
          elementRequest.element_request_id !== undefined
            ? acceptedQuantities[elementRequest.element_request_id] ?? elementRequest.quantity_requested
            : elementRequest.quantity_requested;

        if (elementRequest.element_request_id !== undefined) {
          await createElementRequestResponse(`${elementRequestResponseApi}`, "POST", {
            element_request_id: elementRequest.element_request_id,
            quantity_accepted: acceptedQuantity,
            request_response_id: response.data.request_response_id,
          });
        }
      }

      handleChangeStatus("under_review");
      setOpenSaveModal(true);
    } catch (error) {
      console.error("Error al revisar la solicitud:", error);
    }
  };

  // Aprobado
  const handleApproved = async () => {
    try {
      // Buscar la respuesta existente
      const response = await fetch(`${requestResponseApi}/request/${request_id}`).then((r) => r.json());

      if (!request || !response?.data) return;

      for (const elementRequest of request.elementRequests || []) {
        const acceptedQuantity =
          elementRequest.element_request_id !== undefined
            ? acceptedQuantities[elementRequest.element_request_id] ?? elementRequest.quantity_requested
            : elementRequest.quantity_requested;

        // ✅ Validar que elementRequestResponses exista y tenga elementos
        if (elementRequest.elementRequestResponses?.length && elementRequest.elementRequestResponses.length > 0) {
          await updateElementRequestResponse(
            `${elementRequestResponseApi}/${elementRequest.elementRequestResponses[0].element_request_response_id}`,
            "PATCH",
            {
              element_request_id: elementRequest.element_request_id,
              quantity_accepted: acceptedQuantity,
              request_response_id: response.data.request_response_id,
            }
          );
        } else {
          console.warn(
            `No se encontró ElementRequestResponse para elementRequest_id: ${elementRequest.element_request_id}`
          );
        }
      }

      await updateRequestResponse(`${requestResponseApi}/${response.data.request_response_id}`, "PATCH", {
        request_id: response.data.request_id,
        responder_user_id: Number(user.user_id),
        description: descriptionResponse,
      });

      handleChangeStatus("approved");
    } catch (error) {
      console.error("Error al aprobar la solicitud:", error);
    }
  };

  if (loadingRequest) return <p>Cargando...</p>;
  if (errorRequest) return <ErrorMessage errorMessage={errorRequest} />;
  if (!request) return <ErrorMessage errorMessage="No se encontró la solicitud." />;

  return (
    <>
      <div className="flex flex-col items-center justify-center lg:flex-row lg:items-start w-full h-full p-10 text-gray-800 gap-8">
        <div className="flex flex-col items-start justify-start w-full lg:w-[814px] xl:w-[900px] gap-4 text-gray-800">
          <div className="flex flex-row flex-wrap gap-2 items-start justify-between w-full text-[12px] md:text-[14px]">
            <h1 className="text-2xl font-bold mb-4">SOLICITUD N° {request_id}</h1>
            <div>
              <Button
                icon={<FaArrowLeft />}
                label="Regresar"
                onClick={() => navigate("/admin/requests")}
                bgColor={"#000"}
                bgHoverColor={"#1f1f1f"}
              />
            </div>
          </div>

          {isAdmin && (
            <>
              <p className="mt-4 text-[12px] font-bold">Puedes modificar la cantidad de elementos solicitados:</p>
              <div className="flex flex-col items-start justify-start w-full max-w-2xl">
                <HeaderTableSummary />
                <ContentTableSummary
                  request={request}
                  onQuantityChange={(id, quantity) => setAcceptedQuantities((prev) => ({ ...prev, [id]: quantity }))}
                />
              </div>
              {isInProgress && (
                <div className="flex flex-row flex-wrap items-center gap-8 w-full max-w-2xl text-white mt-2">
                  <Button icon={<FaArrowRight />} label="Revisado" onClick={handleReviewed} bgColor="#f0b100" bgHoverColor="#f69f00" />
                </div>
              )}
            </>
          )}

          {isGerency && (
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
                  <Button icon={<FaCheck />} label="Aprobar" onClick={handleApproved} bgColor="#008000" bgHoverColor="#0c4a28" />
                  <Button icon={<FaTimes />} label="Rechazar" onClick={() => handleChangeStatus("rejected")} bgColor="#d80027" bgHoverColor="#c80008" />
                </div>
              )}
            </>
          )}

          {isLogistics && (
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
                  <Button icon={<FaCheck />} label="Atendido" onClick={() => handleChangeStatus("attended")} bgColor="#0047a3" bgHoverColor="#003d8f" />
                </div>
              )}
            </>
          )}

          {isEmployee && isAttend && (
            <div className="flex flex-row gap-8 w-full max-w-2xl text-white mt-2">
              <Button icon={<FaCheck />} label="Culminado" onClick={() => handleChangeStatus("completed")} bgColor="#ad46ff" bgHoverColor="#9b3bff" />
            </div>
          )}
        </div>
        {pdfUrl && <iframe src={pdfUrl} title="Requerimiento PDF" className="w-full h-full min-h-120" />}
      </div>

      {openSaveModal && (
        <SaveModal
          onOk={() => {
            navigate(0);
          }}
        />
      )}
    </>
  );
}
