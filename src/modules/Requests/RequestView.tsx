import { useEffect, useState } from "react";
import { fetchGetRequestById, fetchUpdateRequestStatus, type RequestType } from "../../data/requestData";
import { fetchCreateRequestResponse } from "../../data/requestResponseData";
import { fetchCreateElementRequestResponse } from "../../data/elementRequestResponseData";
import { FaArrowLeft, FaArrowRight, FaCheck } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Button from "../../Button";
import HeaderTableSummary from "./components/TableSummary/HeaderTableSummary";
import RequestProperty from "./components/RequestProperty";
import ContentTableSummary from "./components/TableSummary/ContentTableSummary";
import SaveModal from "../../SaveModal";

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
  const [acceptedQuantities, setAcceptedQuantities] = useState<{ [key: number]: number }>({});
  const [openSaveModal, setOpenSaveModal] = useState(false);

  const formattedDate = new Date(request?.createdAt || '').toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
    }
  }, [request_id]);

  const handleReviewed = async () => {
    try {
      // 1. Registrar respuesta general de la solicitud
      const response = await fetchCreateRequestResponse({
        request_id: Number(request_id),
        responder_user_id: Number(user.user_id),
        description: "Solicitud revisada por logística."
      });

      // 2. Registrar cada respuesta de elemento
      for (const elementRequest of request.elementRequests || []) {
        const acceptedQuantity = acceptedQuantities[elementRequest.element_request_id] ?? elementRequest.quantity_requested;

        await fetchCreateElementRequestResponse({
          element_request_id: elementRequest.element_request_id,
          quantity_accepted: acceptedQuantity,
          request_response_id: response.data.request_response_id
        });
      }

      // 3. Cambiar estado
      handleChangeStatus("under_review");

      // 4. Recargar la página para reflejar los cambios
      setOpenSaveModal(true);
    } catch (error) {
      console.error("Error al revisar la solicitud:", error);
    }
  };


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
          <RequestProperty label='Proyecto' value={request?.project?.name || '---'} />
          <RequestProperty label='Fecha y hora' value={formattedDate || '---'} />
          <RequestProperty label='Estado' value={statusOptions.find(option => option.value === request?.status)?.label || '---'} />
          <RequestProperty label='Tipo' value={`Req. de Elementos ${typeOptions.find(option => option.value === request?.type)?.label || '---'}`} />
          <RequestProperty label='Descripción' value={request?.description || '---'} />
          { isAdmin && isInProgress && (
            <>
              <p className="mt-4 text-[12px] font-bold">Aquí puedes modificar la cantidad de elementos solicitados antes de enviar la solicitud:</p>
              <div className="flex flex-col items-start justify-start w-full max-w-2xl">
                <HeaderTableSummary />
                <ContentTableSummary request={request} onQuantityChange={(id, quantity) => { setAcceptedQuantities(prev => ({ ...prev, [id]: quantity })); }} />
              </div>
              <div className="flex flex-row flex-wrap items-center justify-start gap-8 w-full max-w-2xl text-[12px] md:text-[14px] text-white mt-2">
                <Button icon={<FaArrowRight />} label="Revisado" onClick={() => handleReviewed()} bgColor='#f0b100' bgHoverColor='#f69f00' />
              </div>
            </>
          )}
          { isGerency && isUnderReview && (
            <div className="flex flex-row flex-wrap items-center justify-start gap-8 w-full max-w-2xl text-[12px] md:text-[14px] text-white mt-2">
              <Button icon={<FaCheck />} label="Aprobar" onClick={() => handleChangeStatus("approved")} bgColor={'#008000'} bgHoverColor={'#0c4a28'} />
              <Button icon={<FaTimes />} label="Rechazar" onClick={() => handleChangeStatus("rejected")} bgColor={'#d80027'} bgHoverColor={'#c80008'} />
          </div>)}
          { isLogistics && isApproved && (
            <div className="flex flex-row flex-wrap items-center justify-start gap-8 w-full max-w-2xl text-[12px] md:text-[14px] text-white mt-2">
              <Button icon={<FaCheck />} label="Atendido" onClick={() => handleChangeStatus("attended")} bgColor={'#0047a3'} bgHoverColor={'#003d8f'} />
            </div>
          )}
          { isEmployee && isAttend && (
            <div className="flex flex-row flex-wrap items-center justify-start gap-8 w-full max-w-2xl text-[12px] md:text-[14px] text-white mt-2">
              <Button icon={<FaCheck />} label="Culminado" onClick={() => handleChangeStatus("completed")} bgColor={'#ad46ff'} bgHoverColor={'#9b3bff'} />
            </div>
          )}
        </div>
        <iframe
            src={`http://localhost:3000/request/pdf/${request_id}`}
            title="Requerimiento PDF"
            className=" w-full h-full"
          />
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