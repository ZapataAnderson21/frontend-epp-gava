import { useEffect, useState } from "react";
import RequestTypeCard from "./components/RequestTypeCard";
import { FaHelmetSafety } from "react-icons/fa6";
import { FaSave, FaTools } from "react-icons/fa";
import HeaderNewRequest from "./components/HeaderNewRequest";
import RowElementRequest from "./components/RowElementRequest";
import { MdAttachEmail } from "react-icons/md";
import RedButton from "../../common/form/RedButton";
import type { RequestType, ElementRequestType, ProjectType } from "../../data/types";
import { RiQuestionFill } from "react-icons/ri";
import { IoWarning } from "react-icons/io5";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction, useHandleForm } from "../../hooks";
import { projectApi, requestApi, elementRequestApi } from "../../data/apiUrl";
import { ErrorMessage } from "../../common/error";
import { useNavigate } from "react-router-dom";
import { SaveModal } from "../../common/form";

interface RequestDraftProps {
  requestId: number;
}

export default function RequestDraft({ requestId }: RequestDraftProps) {
  const [request, setRequest] = useState<RequestType | null>(null);
  const [elementRequests, setElementRequests] = useState<ElementRequestType[]>([]);
  const [projectId, setProjectId] = useState<number>(0);
  const { data: projects } = useFetch<ProjectType[]>(`${projectApi}status/active`);
  const [description, setDescription] = useState<string>("");
  const [passwordCPanel, setPasswordCPanel] = useState<string>("");
  const [openPasswordModal, setOpenPasswordModal] = useState<boolean>(false);
  const [elements, setElements] = useState<any[]>([]);
  const [selectedElementRequest, setSelectedElementRequest] = useState<ElementRequestType[]>([]);

  const [openWarning, setOpenWarning] = useState<boolean>(false);
  const [deliveryDueDate, setDeliveryDueDate] = useState<string>("");

  const [successMessage, setSuccessMessage] = useState<string>("");
  const [onOk, setOnOk] = useState<() => void>(() => () => {});
  const [openSaveModal, setOpenSaveModal] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  // ✅ hooks nuevos
  const { execute: deleteElementRequest } = useApiAction<any>();
  const { data: fetchedRequest } = useFetch<RequestType>(`${requestApi}${requestId}`, [requestId]);
  const { data: fetchedElementRequests } = useFetch<ElementRequestType[]>(`${elementRequestApi}request/${requestId}`, [requestId]);

  const navigate = useNavigate();

  const { handleUpdate, handleUpdateAndSend } = useHandleForm();

  const closeModalAndReset = () => {
    setOpenSaveModal(false);
    setError(false);
  };

  const navigateToRequest = () => {
    navigate(`/admin/requests/${requestId}`);
  };


  useEffect(() => {
    if (fetchedRequest) {
      setRequest(fetchedRequest);
      setProjectId(fetchedRequest.projectId);
      setDescription(fetchedRequest.description || "");
      setDeliveryDueDate(fetchedRequest.deliveryDueDate ? fetchedRequest.deliveryDueDate.slice(0, 16) : "");
    }

    if (fetchedElementRequests) {
      setElementRequests(fetchedElementRequests);
      setSelectedElementRequest(fetchedElementRequests);
      const els = fetchedElementRequests.map((er) => er.element).filter((e) => e !== undefined);
      setElements(els);
    }
  }, [fetchedRequest, fetchedElementRequests]);

  const handleRemoveElement = async (elementRequestId: number) => {
    try {
      const res = await deleteElementRequest(`${elementRequestApi}${elementRequestId}`, "DELETE");
      if (res.statusCode === 200) {
        const deletedElement = elementRequests.find((er) => er.elementRequestId === elementRequestId);
        const deletedElementId = deletedElement?.elementId;

        setElementRequests((prev) => prev.filter((er) => er.elementRequestId !== elementRequestId));
        setSelectedElementRequest((prev) => prev.filter((er) => er.elementRequestId !== elementRequestId));

        if (deletedElementId !== undefined) {
          setElements((prev) => prev.filter((e) => e.elementId !== deletedElementId));
        }
      }
    } catch (error) {
      console.error("Error al eliminar el elemento:", error);
    }
  };

  const handleChangeElementRequest = (elementId: number, field: keyof ElementRequestType, value: string | number) => {
    setElementRequests((prev) =>
      prev.map((er) =>
        er.elementId === elementId ? { ...er, [field]: value } : er
      )
    );

    setSelectedElementRequest((prev) =>
      prev.map((er) =>
        er.elementId === elementId ? { ...er, [field]: value } : er
      )
    );
  };

  const handleUpdateRequest = async () => {

    setOpenSaveModal(true);

    if (projectId === 0) {
      alert("Por favor, selecciona un proyecto.");
      return;
    }

    const result = await handleUpdate(Number(requestId), projectId, elementRequests, description);

    if (result) {
      setSuccessMessage("Solicitud guardada exitosamente.");
      setError(false);
      setOnOk(() => navigateToRequest);
    } else {
      setError(true);
      setSuccessMessage("Error al guardar la solicitud. Por favor, intenta nuevamente.");
      setOnOk(() => closeModalAndReset);
    }
  }

  const handleUpdateAndSendRequest = async () => {

    setOpenPasswordModal(false);
    setOpenSaveModal(true);

    if (projectId === 0) {
      alert("Por favor, selecciona un proyecto.");
      return;
    }

    const result = await handleUpdateAndSend(Number(requestId), projectId, elementRequests, passwordCPanel, description);

    if (result) {
      setSuccessMessage("Solicitud enviada exitosamente.");
      setError(false);
      setOnOk(() => navigateToRequest);
    } else {
      setError(true);
      setSuccessMessage("Error al enviar la solicitud. Por favor, intenta nuevamente.");
      setOnOk(() => closeModalAndReset);
    }
  }


  if (!projects) {
    return <ErrorMessage errorMessage="Error al cargar los proyectos. Por favor, intenta nuevamente más tarde." />;
  }

  return (
    <>
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
          <h1 className="text-2xl font-bold mb-4">SOLICITUD {requestId}</h1>
        </div>

        <div className="flex flex-col items-start justify-start gap-6 w-full max-w-2xl h-full text-[14px] text-gray-600">
          <span className="font-semibold">Elige el proyecto:</span>
          <select
            className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3] w-full"
            value={projectId ?? ""}
            onChange={(e) => setProjectId(Number(e.target.value))}
          >
            <option value={0} disabled>Selecciona un proyecto</option>
            {projects.map((project) => (
              <option key={project.projectId} value={project.projectId}>
                {project.name}
              </option>
            ))}
          </select>

          <span className="font-semibold flex items-center w-full justify-between">
            Fecha y hora de entrega:
            <div className="relative">
              <RiQuestionFill className="inline-flex text-amber-500 cursor-pointer size-5" onClick={() => setOpenWarning(!openWarning)} />
              {openWarning && (
                <p className="absolute bg-amber-500 p-2 rounded-md text-white font-semibold inline-flex w-78 right-0 top-6 gap-1 mb-1">
                  <IoWarning className="w-8 mt-1" />
                  Recuerda que si el requerimiento es para mañana, la hora límite para pedirlo es 1 PM. 
                  Si es para pasado mañana, el límite es 5 PM.
                </p>
              )}
            </div>
          </span>
          <input
            type="datetime-local"
            className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3] w-full"
            value={deliveryDueDate}
            onChange={(e) => {
              const value = e.target.value;
              localStorage.setItem("deliveryDueDate", value);
              const selectedDate = new Date(value);
              const hour = selectedDate.getHours();
              if (hour < 8 || hour > 18) {
                alert("La hora debe ser dentro del horario laboral (8:00 - 18:00).");
                return;
              }
              setDeliveryDueDate(value);
            }}
            min={(() => {
              const now = new Date();
              now.setHours(8, 0, 0, 0);
              return now.toISOString().slice(0, 16);
            })()}
            max={(() => {
              const future = new Date();
              future.setDate(future.getDate() + 30);
              future.setHours(18, 0, 0, 0);
              return future.toISOString().slice(0, 16);
            })()}
          />

          <span className="font-semibold">Busca los elementos que vas a seleccionar:</span>
          <div className="flex flex-row items-center justify-around gap-4 w-full">
            <RequestTypeCard icon={<FaHelmetSafety className="size-16" />} title="Seguridad" typeElement="security" />
            <RequestTypeCard icon={<FaTools className="size-16" />} title="Operativo" typeElement="operative" />
          </div>

          <div className="flex flex-col items-start gap-2 justify-start w-full">
            {selectedElementRequest.length > 0 ? (
              <>
                <span className="font-semibold pt-2 pb-4">Elementos seleccionados:</span>
                <HeaderNewRequest />

                {elements.map((element) => {
                  const elementRequest = elementRequests.find(req => req.elementId === element.elementId) || {
                    unit: "",
                    quantityRequested: element.quantityRequested,
                    elementId: element.elementId,
                    requestId: 0,
                    element: element,
                    elementRequestId: undefined,
                  };

                  return (
                    <RowElementRequest
                      key={element.elementId}
                      elementRequest={elementRequest}
                      handleRemoveElement={() => elementRequest.elementRequestId ? handleRemoveElement(elementRequest.elementRequestId) : undefined}
                      handleChangeElementRequest={handleChangeElementRequest}
                    />
                  );
                })}

                <span className="mt-4 font-semibold">Añade una descripción <span className="text-[10px] font-bold"> (opcional)</span></span>
                <textarea className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3] w-full" value={description} onChange={(e) => setDescription(e.target.value)} />

                {request?.status === "draft" && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full mt-4">
                    <button
                      className="w-full flex flex-row gap-2 items-center justify-center bg-[#0047a3] px-4 py-2 rounded-md shadow-sm transition-colors 
                                hover:bg-[#003a80] cursor-pointer text-white font-semibold mt-1"
                      onClick={() => handleUpdateRequest()}
                    >
                      <FaSave /> Guardar
                    </button>
                    <button
                      className="w-full flex flex-row gap-2 items-center justify-center bg-[black] px-4 py-2 rounded-md shadow-sm transition-colors 
                                hover:bg-gray-900 cursor-pointer text-white font-semibold mt-1"
                      onClick={() => setOpenPasswordModal(true)}
                    >
                      <MdAttachEmail /> Guardar y Enviar
                    </button>
                  </div>
                )}
              </>
            ) : (
              <span className="text-gray-500 border-t border-b border-gray-400 w-full py-4 px-2 mb-4">
                No hay elementos seleccionados.
              </span>
            )}
            <RedButton href="/admin/requests" name="Regresar" />
          </div>
        </div>
      </div>

      {openPasswordModal && (
        <div className={`fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center`}>
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Contraseña del Panel de Control</h2>
            <input
              type="password"
              className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3] w-full mb-4"
              placeholder="Ingresa la contraseña"
              value={passwordCPanel}
              onChange={(e) => setPasswordCPanel(e.target.value)}
            />
            <div className="flex justify-between">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-400 transition-colors cursor-pointer"
                onClick={() => setOpenPasswordModal(false)}
              >
                Cancelar
              </button>
              <button
                className="bg-[#0047a3] text-white px-4 py-2 rounded-md hover:bg-[#003a80] transition-colors cursor-pointer"
                onClick={() => { handleUpdateAndSendRequest(); }}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {
        openSaveModal && (
          <SaveModal onOk={onOk} message={successMessage} error={error} />
        )
      }
    </>
  );
}
