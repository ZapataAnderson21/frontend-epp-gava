import RequestTypeCard from "./components/RequestTypeCard";
import { FaHelmetSafety } from "react-icons/fa6";
import { FaSave, FaTools } from "react-icons/fa";
import { type Element, type ElementRequest } from "../../Types";
import { useEffect, useState } from "react";
import HeaderNewRequest from "./components/HeaderNewRequest";
import RowElementRequest from "./components/RowElementRequest";
import RedButton from "../../RedButton";
import { MdAttachEmail } from "react-icons/md";
import { fetchGetByStatus, type ProjectType } from "../../data/projectData";
import { handleSave, handleSaveAndSend}  from "./HandleForm";
import { IoWarning } from "react-icons/io5";
import SaveModal from "../../SaveModal";
import { useNavigate } from "react-router-dom";
import { RiQuestionFill } from "react-icons/ri";

export default function NewRequest() {
  const [projectId, setProjectId] = useState<number>(localStorage.getItem("projectId") ? Number(localStorage.getItem("projectId")) : 0);
  const [deliveryDueDate, setDeliveryDueDate] = useState<string>(localStorage.getItem("deliveryDueDate") || "");
  const selectedElements: Element[] = JSON.parse(localStorage.getItem("selectedElements") || "[]");
  const selectedElementRequest: ElementRequest[] = JSON.parse(localStorage.getItem("selectedElementRequest") || "[]");
  const [description, setDescription] = useState<string>("");

  const [elements, setElements] = useState<Element[]>(selectedElements);
  const [elementRequests, setElementRequests] = useState<ElementRequest[]>(selectedElementRequest);

  const [projects, setProjects] = useState<ProjectType[]>([]);

  const [passwordCPanel, setPasswordCPanel] = useState<string>("");
  const [openPasswordModal, setOpenPasswordModal] = useState<boolean>(false);

  const [openSaveModal, setOpenSaveModal] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      const response = await fetchGetByStatus("active");
      if (response.statusCode === 200) {
        setProjects(response.data);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedElements: Element[] = JSON.parse(localStorage.getItem("selectedElements") || "[]");
      setElements(updatedElements);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleRemoveElement = (element: Element) => {
    const updatedElements = elements.filter((elem) => elem.element_id !== element.element_id);
    const updatedElementRequests = elementRequests.filter((req) => req.element_id !== element.element_id);

    setElements(updatedElements);
    setElementRequests(updatedElementRequests);

    localStorage.setItem("selectedElements", JSON.stringify(updatedElements));
    localStorage.setItem("selectedElementRequest", JSON.stringify(updatedElementRequests));
  };

  const handleChangeElementRequest = (element_id: number, field: keyof ElementRequest, value: string | number) => {
    const updated = elementRequests.map((req) =>
      req.element_id === element_id ? { ...req, [field]: field === "quantity_requested" ? Number(value) : value } : req
    );
    setElementRequests(updated);
    localStorage.setItem("selectedElementRequest", JSON.stringify(updated));
  };

  const handleSaveRequest = async () => {
    if (projectId === 0) {
      alert("Por favor, selecciona un proyecto.");
      return;
    }

    try {
      const result = await handleSave(projectId, deliveryDueDate, description);
      if (result) {
        setOpenSaveModal(true);
        setElements([]);
        setElementRequests([]);
        localStorage.removeItem("projectId");
        localStorage.removeItem("deliveryDueDate");
        localStorage.removeItem("selectedElements");
        localStorage.removeItem("selectedElementRequest");
      } else {
        alert("Error al guardar la solicitud.");
      }
    } catch (error) {
      console.error("Error al guardar la solicitud:", error);
      alert("Ocurrió un error al guardar la solicitud.");
    }
  };

  const handleSaveAndSendRequest = async () => {
    if (projectId === 0) {
      alert("Por favor, selecciona un proyecto.");
      return;
    }

    try {
      const result = await handleSaveAndSend(projectId, deliveryDueDate, description, passwordCPanel);
      if (result) {
        setOpenPasswordModal(false);
        setOpenSaveModal(true);
        setElements([]);
        setElementRequests([]);
        localStorage.removeItem("projectId");
        localStorage.removeItem("deliveryDueDate");
        localStorage.removeItem("selectedElements");
        localStorage.removeItem("selectedElementRequest");
      } else {
        alert("Error al guardar y enviar la solicitud.");
      }
    } catch (error) {
      console.error("Error al guardar y enviar la solicitud:", error);
      alert("Ocurrió un error al guardar y enviar la solicitud.");
    }
  }

  return (
    <>
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
          <h1 className="text-2xl font-bold mb-4">REGISTRAR SOLICITUD</h1>
        </div>

        <p className="text-amber-500 font-semibold inline-flex gap-1 mb-3">
          <IoWarning className="w-8 mt-1" /> 
          Recuerda que si el requerimiento es para mañana, la hora límite para pedirlo es 1 PM. Si es para pasado mañana, el límite es 5 PM.
        </p>

        <div className="flex flex-col items-start justify-start gap-3 w-full max-w-2xl h-full text-[14px] text-gray-600">
          <span className="font-semibold">Elige el proyecto:</span>
          <select
            className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3] w-full mb-3"
            value={projectId}
            onChange={(e) => {
              setProjectId(Number(e.target.value));
              localStorage.setItem("projectId", e.target.value);
            }}>
            <option value={0} disabled>Selecciona un proyecto</option>
            {projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.name}
              </option>
            ))}
          </select>

          <span className="font-semibold flex items-center w-full justify-between">Fecha y hora de entrega: <RiQuestionFill className="inline-flex text-gray-500 cursor-pointer size-5" /></span>
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
          <div className="flex flex-row items-center justify-around gap-4 w-full mb-3">
            <RequestTypeCard icon={<FaHelmetSafety className="size-16" />} title="Seguridad" typeElement="security" />
            <RequestTypeCard icon={<FaTools className="size-16" />} title="Operativo" typeElement="operative" />
          </div>
          <div className="flex flex-col items-start gap-2 justify-start w-full">
            {
              selectedElements.length > 0 ? (
                <>
                <span className="font-semibold pt-2 pb-4">Elementos seleccionados:</span>
                <HeaderNewRequest />
                  {elements.map((element) => (
                    <RowElementRequest 
                      key={element.element_id}
                      elementRequest={
                        elementRequests.find(req => req.element_id === element.element_id) || 
                        { unit: "", quantity_requested: 0, element_id: element.element_id!, request_id: 0, element: element }
                      }
                      handleRemoveElement={handleRemoveElement}
                      handleChangeElementRequest={handleChangeElementRequest}
                    />
                  ))}

                  <span className="mt-4 font-semibold">Añade una descripción <span className="text-[10px] font-bold"> (opcional)</span></span>
                  <textarea className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3] w-full" value={description} onChange={(e) => setDescription(e.target.value)} />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full mt-4">
                    <button className="w-full flex flex-row gap-2 items-center justify-center bg-[#0047a3] px-4 py-2 rounded-md shadow-sm transition-colors 
                                    hover:bg-[#003a80] cursor-pointer text-white font-semibold mt-1" 
                                    onClick={handleSaveRequest} >
                    <FaSave /> Guardar
                    </button>
                    <button className="w-full flex flex-row gap-2 items-center justify-center bg-[black] px-4 py-2 rounded-md shadow-sm transition-colors 
                                    hover:bg-gray-900 cursor-pointer text-white font-semibold mt-1" 
                                    onClick={() => setOpenPasswordModal(true)} >
                    <MdAttachEmail /> Guardar y Enviar
                    </button>
                  </div>
                </>
              ) : (
                <span className="text-gray-500 border-t border-b border-gray-400 w-full py-4 px-2 mb-4">No hay elementos seleccionados.</span>
              )
            }
            <RedButton href="/admin/requests" name="Regresar" />
          </div>
        </div>
      </div>
      {
        openPasswordModal && (
          <div className={`fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center`}>
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Contraseña del Sistema de Correos</h2>
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
                  onClick={handleSaveAndSendRequest}>
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )
      }
      {
        openSaveModal && (
          <SaveModal onOk={() => {
            navigate("/admin/requests");
            localStorage.removeItem("projectId");
            localStorage.removeItem("deliveryDueDate");
          }} />
        )
      }
      </>
  );
}
