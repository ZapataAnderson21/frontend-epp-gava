import { useEffect, useState } from "react";
import { fetchGetRequestById, fetchUpdateRequestStatus, type RequestType } from "../../data/requestData";
import { fetchCreateRequestResponse, fetchGetRequestResponseByRequestId, fetchUpdateRequestResponse, type RequestResponseType } from "../../data/requestResponseData";
import { fetchCreateElementRequestResponse, fetchUpdateElementRequestResponse } from "../../data/elementRequestResponseData";
import { FaArrowLeft, FaArrowRight, FaCheck } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import HeaderTableSummary from "./components/TableSummary/HeaderTableSummary";
import RequestProperty from "./components/RequestProperty";
import ContentTableSummary from "./components/TableSummary/ContentTableSummary";
import SaveModal from "../../components/SaveModal";

interface RequestViewProps {
  request_id: number;
}

const statusOptions = [
  { value: "draft", label: "Borrador" },
  { value: "in_progress", label: "En progreso" },
  { value: "under_review", label: "En revisión" },
  { value: "approved", label: "Aprobado" },
  { value: "rejected", label: "Rechazado" },
  { value: "attended", label: "Atendido" },
  { value: "completed", label: "Completado" }
];

const typeOptions = [
  { value: "operative", label: "Operativos" },
  { value: "security", label: "de Protección Personal (EPP)" },
  { value: "operative_and_security", label: "Operativos y EPP" }
];

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
  const [request, setRequest] = useState<RequestType>( {} as RequestType);
  const [requestResponse, setRequestResponse] = useState<RequestResponseType>({} as RequestResponseType);
  const [descriptionResponse, setDescriptionResponse] = useState("");
  const [acceptedQuantities, setAcceptedQuantities] = useState<{ [key: number]: number }>({});
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch(`https://sir.gavacyc.com/api/request/pdf/${request_id}`, {
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

  const formattedDate = request?.createdAt
    ? new Date(request.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '---';

  const formattedDeliveryDueDate = request?.delivery_due_date
    ? new Date(request.delivery_due_date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '---';

  const navigate = useNavigate();  

  useEffect(() => {
    if (!user || !user.userUserTypes) return;

    const userType = user.userUserTypes[0].userType.name;
    if (["GERENTE"].includes(userType)) {
      setIsGerency(true);
    }
    if (["LOGISTICA"].includes(userType)) {
      setIsLogistics(true);
    }
    if (["ADMINISTRADORA"].includes(userType)) {
      setIsAdmin(true);
    }
    if (!["GERENTE", "ADMINISTRADORA", "LOGISTICA"].includes(userType)) {
      setIsEmployee(true);
    }
    if (request && request.status === "in_progress") {
      setIsInProgress(true);
    }
    if (request && request.status === "under_review") {
      setIsUnderReview(true);
    }
    if (request && request.status === "approved") {
      setIsApproved(true);
    }
    if (request && request.status === "attended") {
      setIsAttend(true);
    }
  }, [user]);

  useEffect(() => {
    if (request_id) {
      fetchGetRequestById(Number(request_id)).then((response) => {
        setRequest(response.data);
      });

      fetchGetRequestResponseByRequestId(Number(request_id)).then((response) => {
        if (response.data) {
          setRequestResponse(response.data);
          setDescriptionResponse(response.data.description || "");
        }
      });

    }
  }, [request_id]);

  const handleReviewed = async () => {
    try {
      // 1. Registrar respuesta general de la solicitud
      const response = await fetchCreateRequestResponse({
        request_id: Number(request_id),
        responder_user_id: Number(user.user_id),
        description: "Solicitud revisada por administración."
      });

      // 2. Registrar cada respuesta de elemento
      for (const elementRequest of request.elementRequests || []) {
        const acceptedQuantity = elementRequest.element_request_id !== undefined
          ? acceptedQuantities[elementRequest.element_request_id] ?? elementRequest.quantity_requested
          : elementRequest.quantity_requested;

        if (elementRequest.element_request_id !== undefined) {
          await fetchCreateElementRequestResponse({
            element_request_id: elementRequest.element_request_id,
            quantity_accepted: acceptedQuantity,
            request_response_id: response.data.request_response_id
          });
        } else {
          console.warn("element_request_id is undefined for elementRequest:", elementRequest);
        }
      }

      // 3. Cambiar estado
      handleChangeStatus("under_review");

      // 4. Recargar la página para reflejar los cambios
      setOpenSaveModal(true);
    } catch (error) {
      console.error("Error al revisar la solicitud:", error);
    }
  };

  const handleApproved = async () => {
    console.log("Aprobando solicitud con ID:", request_id);
    try{
      //1. Buscar la RequestResponseByRequestId

      const response = await fetchGetRequestResponseByRequestId(Number(request_id));
      if (!response.data) {
        console.log("No se encontró la respuesta de la solicitud.");
      }

      console.log("Respuesta de la solicitud:", response.data);

      //2. Actualizar las cantidades aceptadas de las ElementRequestResponse
      for (const elementRequest of request.elementRequests || []) {
        const acceptedQuantity = elementRequest.element_request_id !== undefined
          ? acceptedQuantities[elementRequest.element_request_id] ?? elementRequest.quantity_requested
          : elementRequest.quantity_requested;

        console.log("Actualizando ElementRequestResponse con ID:", elementRequest.element_request_id, "Cantidad aceptada:", acceptedQuantity);

        if (
          elementRequest.elementRequestResponses &&
          elementRequest.elementRequestResponses.length > 0
        ) {
          await fetchUpdateElementRequestResponse(elementRequest.elementRequestResponses[0].element_request_response_id, {
            element_request_id: elementRequest.element_request_id,
            quantity_accepted: acceptedQuantity,
            request_response_id: response.data.request_response_id
          });
        } else {
          console.warn(
            `No se encontró ElementRequestResponse para elementRequest_id: ${elementRequest.element_request_id}`
          );
        }
      }

      //3. Actualizar la RequestResponse con la descripción

      console.log("Actualizando RequestResponse con ID:", response.data.request_response_id, "Descripción:", descriptionResponse);

      const bodyUpdate = {
        request_id: response.data.request_id,
        responder_user_id: Number(user.user_id),
        description: descriptionResponse
      };

      console.log("Cuerpo de actualización:", bodyUpdate);

      await fetchUpdateRequestResponse(response.data.request_response_id, bodyUpdate);

      //4. Actualiza el estado de la request a "approved"
      handleChangeStatus("approved");
    } catch (error) {
      console.error("Error al aprobar la solicitud:", error);
    }
  }


  const handleChangeStatus = (newStatus: string) => {
    if (request) {
      fetchUpdateRequestStatus(request.request_id, newStatus).then((response) => {
        setRequest(response.data);
      });
      navigate(0);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center lg:flex-row lg:items-start w-full h-full p-10 text-gray-800 gap-8">
        <div className="flex flex-col items-start justify-start w-full lg:w-[814px] xl:w-[900px] gap-4 text-gray-800">
          <div className="flex flex-row flex-wrap gap-2 items-start justify-between w-full text-[12px] md:text-[14px]">
            <h1 className="text-2xl font-bold mb-4">SOLICITUD N° {request_id}</h1>
            <div>
              <Button icon={<FaArrowLeft />} label="Regresar" onClick={() => navigate('/admin/requests')} bgColor={'#000'} bgHoverColor={'#1f1f1f'} />
            </div>
          </div>

          {isAdmin && (
            <>
              <p className="mt-4 text-[12px] font-bold">Aquí puedes modificar la cantidad de elementos solicitados antes de enviar la solicitud:</p>
              <div className="flex flex-col items-start justify-start w-full max-w-2xl">
                <HeaderTableSummary />
                <ContentTableSummary request={request} onQuantityChange={(id, quantity) => { setAcceptedQuantities(prev => ({ ...prev, [id]: quantity })); }} />
              </div>
              {isInProgress && (
                <div className="flex flex-row flex-wrap items-center justify-start gap-8 w-full max-w-2xl text-[12px] md:text-[14px] text-white mt-2">
                  <Button icon={<FaArrowRight />} label="Revisado" onClick={() => handleReviewed()} bgColor='#f0b100' bgHoverColor='#f69f00' />
                </div>
              )}
            </>
          )}

          {isGerency && (
            <>
              <p className="mt-1 text-[12px] font-bold">Aquí puedes modificar la cantidad de elementos solicitados antes de enviar la solicitud:</p>
              <div className="flex flex-col items-start justify-start w-full max-w-2xl">
                <HeaderTableSummary />
                <ContentTableSummary request={request} onQuantityChange={(id, quantity) => { setAcceptedQuantities(prev => ({ ...prev, [id]: quantity })); }} />
              </div>
              <p className="mt-4 text-[12px] font-bold">Respuesta:</p>
              <p className="text-[12px] font-bold"> {requestResponse.description}</p>
              <textarea
                className="w-full h-24 p-2 border-2 border-gray-300 rounded-md"
                placeholder="Escribe aquí tus comentarios o justificaciones para la aprobación o rechazo..."
                value={descriptionResponse}
                onChange={(e) => {
                  setDescriptionResponse(e.target.value);
                  console.log(descriptionResponse);
                }}
              ></textarea>
              {isUnderReview && (
                <div className="flex flex-row flex-wrap items-center justify-start gap-8 w-full max-w-2xl text-[12px] md:text-[14px] text-white mt-2">
                  <Button icon={<FaCheck />} label="Aprobar" onClick={() => handleApproved()} bgColor={'#008000'} bgHoverColor={'#0c4a28'} />
                  <Button icon={<FaTimes />} label="Rechazar" onClick={() => handleChangeStatus("rejected")} bgColor={'#d80027'} bgHoverColor={'#c80008'} />
                </div>
              )}
            </>
          )}

          {isLogistics && (
            <>
              <div className="flex flex-col items-start justify-start w-full max-w-2xl">
                <HeaderTableSummary />
                <ContentTableSummary request={request} onQuantityChange={(id, quantity) => { setAcceptedQuantities(prev => ({ ...prev, [id]: quantity })); }} />
              </div>
              <div>Respuesta: <span>{requestResponse.description}</span></div>
              
              {isApproved && (
                <div className="flex flex-row flex-wrap items-center justify-start gap-8 w-full max-w-2xl text-[12px] md:text-[14px] text-white mt-2">
                  <Button icon={<FaCheck />} label="Atendido" onClick={() => handleChangeStatus("attended")} bgColor={'#0047a3'} bgHoverColor={'#003d8f'} />
                </div>
              )}
            </>
          )}

          {isEmployee && isAttend && (
            <div className="flex flex-row flex-wrap items-center justify-start gap-8 w-full max-w-2xl text-[12px] md:text-[14px] text-white mt-2">
              <Button icon={<FaCheck />} label="Culminado" onClick={() => handleChangeStatus("completed")} bgColor={'#ad46ff'} bgHoverColor={'#9b3bff'} />
            </div>
          )}
        </div>
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            title="Requerimiento PDF"
            className="w-full h-full min-h-120"
          />
        )}
      </div>
      {
        openSaveModal && (
          <SaveModal
            onOk={() => {
              navigate(0);
            }}
          />
        )}
    </>
  );
}