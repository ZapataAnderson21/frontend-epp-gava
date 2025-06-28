import { useParams } from "react-router-dom";
import { fetchGetRequestById } from "../../data/requestData";
import { fetchGetElementRequestsByRequest, fetchDeleteElementRequest } from "../../data/elementRequestData";
import { useEffect, useState } from "react";
import RequestTypeCard from "./components/RequestTypeCard";
import { FaHelmetSafety } from "react-icons/fa6";
import { FaSave, FaTools } from "react-icons/fa";
import HeaderNewRequest from "./components/HeaderNewRequest";
import RowElementRequest from "./components/RowElementRequest";
import { handleSave, handleSaveAndSend } from "./HandleForm";
import { MdAttachEmail } from "react-icons/md";
import RedButton from "../../RedButton";
import Info from "../../Info";
import { fetchGetByStatus } from "../../data/projectData";

export default function Request() {
  const { id: request_id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<any>(null);
  const [elementRequests, setElementRequests] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<number>(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [description, setDescription] = useState<string>("");
  const [passwordCPanel, setPasswordCPanel] = useState<string>("");
  const [openPasswordModal, setOpenPasswordModal] = useState<boolean>(false);
  const [elements, setElements] = useState<any[]>([]);
  const [selectedElements, setSelectedElements] = useState<any[]>([]);
  const [selectedElementRequest, setSelectedElementRequest] = useState<any[]>([]);

  useEffect(() => {
    const fetchRequest = async () => {
      if (request_id) {
        const response = await fetchGetRequestById(Number(request_id));
        if (response.statusCode === 200) {
          setRequest(response.data);
          setProjectId(response.data.project_id);
          setDescription(response.data.description || "");
        }
      }
    };

    const fetchElementRequests = async () => {
      if (request_id) {
        const response = await fetchGetElementRequestsByRequest(Number(request_id));
        if (response.statusCode === 200) {
          setElementRequests(response.data);
          setSelectedElementRequest(response.data);
        }
      }
    };

    fetchRequest();
    fetchElementRequests();
  }, [request_id]);

  useEffect(() => {
    const fetchProjects = async () => {
      const response = await fetchGetByStatus("active");
      if (response.statusCode === 200) {
        setProjects(response.data);
      }
    };

    fetchProjects();
  }, []);
  
  const handleRemoveElement = (element: any) => {

  }

  const handleChangeElementRequest = (elementRequest: any) => {
    const updatedRequests = elementRequests.map((req) =>
      req.element_id === elementRequest.element_id ? elementRequest : req
    );
    setElementRequests(updatedRequests);
  };

  return (
    <>
          <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
            <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
              <h1 className="text-2xl font-bold mb-4">SOLICITUD {request_id}</h1>
            </div>
    
            <div className="flex flex-col items-start justify-start gap-6 w-full max-w-2xl h-full text-[14px] text-gray-600">
              <span className="font-semibold">Elige el proyecto:</span>
              <select
                className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3] w-full"
                value={projectId ?? ""}
                onChange={(e) => setProjectId(Number(e.target.value))} >
                <option value={0} disabled>Selecciona un proyecto</option>
                {projects.map((project) => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.name}
                  </option>
                ))}
              </select>
    
              <span className="font-semibold">Busca los elementos que vas a seleccionar:</span>
              <div className="flex flex-row items-center justify-around gap-4 w-full">
                <RequestTypeCard icon={<FaHelmetSafety className="size-16" />} title="Seguridad" typeElement="security" />
                <RequestTypeCard icon={<FaTools className="size-16" />} title="Operativo" typeElement="operative" />
              </div>
              <div className="flex flex-col items-start gap-2 justify-start w-full">
                {
                  selectedElementRequest.length > 0 ? (
                    <>
                    <span className="font-semibold pt-2 pb-4">Elementos seleccionados:</span>
                    <HeaderNewRequest />
                      {selectedElementRequest.map((element) => (
                        <RowElementRequest 
                          key={element.element_id}
                          elementRequest={
                            elementRequests.find(req => req.element_id === element.element_id) || 
                            { unit: "", quantity: element.quantity_requested, element_id: element.element_id!, request_id: 0, element: element }
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
                                        onClick={() => handleSave(projectId, description)} >
                        <FaSave /> Guardar
                        </button>
                        <button className="w-full flex flex-row gap-2 items-center justify-center bg-[black] px-4 py-2 rounded-md shadow-sm transition-colors 
                                        hover:bg-gray-900 cursor-pointer text-white font-semibold mt-1" 
                                        onClick={() => setOpenPasswordModal(true)} >
                        <MdAttachEmail /> Enviar
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
    
    
            <Info />
          </div>
            {
              openPasswordModal && (
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
                        onClick={() => {
                          handleSaveAndSend(projectId, description, passwordCPanel);
                          setOpenPasswordModal(false);
                        }}
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              )
            }
          </>
  );
}
