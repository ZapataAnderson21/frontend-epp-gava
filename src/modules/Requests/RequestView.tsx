import { useEffect, useState } from "react";
import { fetchGetRequestById, fetchUpdateRequestStatus, type RequestType } from "../../data/requestData";
import RedButton from "../../RedButton";
import { FaArrowRight, FaCheck } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface RequestViewProps {
  request_id: number;
}

const statusOptions = [
  { value: "draft", label: "Borrador" },
  { value: "pending", label: "Pendiente" },
  { value: "reviewed", label: "En Gerencia" },
  { value: "accepted", label: "Aceptado" },
  { value: "rejected", label: "Rechazado" },
];

const typeOptions = [
  { value: "operative", label: "Operativos" },
  { value: "security", label: "de Protección Personal (EPP)" },
  { value: "operative and security", label: "Operativos y EPP" }
];

export default function RequestView({ request_id }: RequestViewProps) {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [permission, setPermission] = useState(false);
  const [request, setRequest] = useState<RequestType>();
  const formattedDate = new Date(request?.registration_date || '').toLocaleDateString('es-ES', {
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
    if (["GERENTE", "ADMINISTRADORA", "SISTEMAS"].includes(userType)) {
      setPermission(true);
    }
  }, [user]);

  useEffect(() => {
    if (request_id) {
      fetchGetRequestById(Number(request_id)).then((response) => {
        setRequest(response.data);
      });
    }
  }, [request_id]);

  const handleChangeStatus = (newStatus: string) => {
    if (request) {
      fetchUpdateRequestStatus(request.request_id, newStatus).then((response) => {
        setRequest(response.data);
      });
      navigate(0);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center lg:flex-row lg:items-start w-full h-full p-10 text-gray-800 gap-8">
      <div className="flex flex-col items-start justify-start w-full lg:w-[680px] xl:w-[800px] gap-4 text-gray-800">
        <div className="flex flex-row flex-wrap gap-2 items-start justify-between w-full text-[12px] md:text-[14px]">
          <h1 className="text-2xl font-bold mb-4">SOLICITUD N° {request_id}</h1>
          <div>
            <RedButton href="/admin/requests" name="Regresar" />
          </div>
        </div>
        <div className="flex flex-row items-start justify-start gap-2 w-full max-w-2xl text-[14px] text-gray-700">
          <span className="font-semibold text-nowrap">Proyecto:</span>
          <span>{request?.project?.name}</span>
        </div>
        <div className="flex flex-row items-start justify-start gap-2 w-full max-w-2xl text-[14px] text-gray-700">
          <span className="font-semibold text-nowrap">Fecha y hora:</span>
          <span>{formattedDate}</span>
        </div>
        <div className="flex flex-row items-start justify-start gap-2 w-full max-w-2xl text-[14px] text-gray-700">
          <span className="font-semibold text-nowrap">Estado:</span>
          <span>{statusOptions.find(option => option.value === request?.status)?.label}</span>
        </div>
        <div className="flex flex-row items-start justify-start gap-2 w-full max-w-2xl text-[14px] text-gray-700">
          <span className="font-semibold text-nowrap">Tipo:</span>
          <span>Req. de Elementos {typeOptions.find(option => option.value === request?.type)?.label}</span>
        </div>
        <div className="flex flex-row items-start justify-start gap-2 w-full max-w-2xl text-[14px] text-gray-700">
          <span className="font-semibold text-nowrap">Descripción:</span>
          <span>{request?.description}</span>
        </div>
        { permission && (
          <div className="flex flex-row flex-wrap items-center justify-start gap-8 w-full max-w-2xl text-[12px] md:text-[14px] text-white mt-2">
          <button 
            className="bg-[#0047a3] cursor-pointer px-4 py-2 rounded-md shadow-sm hover:bg-[#003d8f] transition-colors
                         font-bold flex flex-row gap-2 items-center" onClick={() => handleChangeStatus("reviewed")}>
                          <FaArrowRight /> Pasar a Gerencia
          </button>
          <button className="bg-[#218838] cursor-pointer px-4 py-2 rounded-md shadow-sm hover:bg-[#28a745] transition-colors
                            font-bold flex flex-row gap-2 items-center" onClick={() => handleChangeStatus("accepted")}>
                          <FaCheck /> Autorizar
          </button>
          <button className="bg-[#d80027] cursor-pointer px-4 py-2 rounded-md shadow-sm hover:bg-[#c80008] transition-colors font-bold flex flex-row gap-2 items-center" onClick={() => handleChangeStatus("rejected")}>
                          <FaTimes /> Rechazar
          </button>
        </div>)}
      </div>
      <iframe
          src={`http://localhost:3000/request/pdf/${request_id}`}
          title="Requerimiento PDF"
          className=" w-full h-full"
        />
    </div>
  );
}