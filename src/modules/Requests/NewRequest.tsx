import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoWarning } from "react-icons/io5";
import { RiQuestionFill } from "react-icons/ri";
import { MdAttachEmail, MdEngineering } from "react-icons/md";
import { FaHelmetSafety, FaPersonDigging } from "react-icons/fa6";
import { FaTools } from "react-icons/fa";
import { TiArrowBack } from "react-icons/ti";

import RequestTypeCard from "./components/ModalElements/RequestTypeCard";
import type { ElementRequestType, Project, ElementType, Worker, RequestWorker } from "../../data/types";
import HeaderNewRequest from "./components/HeaderNewRequest";
import RowElementRequest from "./components/RowElementRequest";
import { InputForm, SelectForm, TextAreaForm, ButtonContainer } from "../../common/form";
import toast, { Toaster } from "react-hot-toast";
import { projectApi } from "../../data/apiUrl";
import { useFetch, useHandleForm } from "../../hooks";
import { ErrorMessage } from "../../common/error";
import { Button } from "../../components";
import WorkerSelectCard from "./components/ModalWorkers/WorkerSelectCard";
import HeaderWorkers from "./components/HeaderWorkers";
import RowRequestWorker from "./components/RowRequestWorker";
import { ReturnButton, SaveButton } from "../../common/button";

export default function NewRequest() {
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get("projectId");
  
  const [projectId, setProjectId] = useState<number>(projectIdParam ? Number(projectIdParam) : 0);
  const [deliveryDueDate, setDeliveryDueDate] = useState<string>(localStorage.getItem("deliveryDueDate") || "");
  const selectedElements: ElementType[] = JSON.parse(localStorage.getItem("selectedElements") || "[]");
  const selectedElementRequest: ElementRequestType[] = JSON.parse(localStorage.getItem("selectedElementRequest") || "[]");
  const selectedWorkers: Worker[] = JSON.parse(localStorage.getItem("selectedWorkers") || "[]");
  const selectedRequestWorkers: RequestWorker[] = JSON.parse(localStorage.getItem("selectedRequestWorkers") || "[]");

  const [description, setDescription] = useState<string>("");

  const [elements, setElements] = useState<ElementType[]>(selectedElements);
  const [elementRequests, setElementRequests] = useState<ElementRequestType[]>(selectedElementRequest);

  const [workers, setWorkers] = useState<Worker[]>(selectedWorkers);
  const [requestWorkers, setRequestWorkers] = useState<RequestWorker[]>(selectedRequestWorkers);

  const { data: projects } = useFetch<Project[]>(`${projectApi}status/active`, []);

  const [passwordCPanel, setPasswordCPanel] = useState<string>("");
  const [openPasswordModal, setOpenPasswordModal] = useState<boolean>(false);
  const [openWarning, setOpenWarning] = useState<boolean>(false);

  const navigate = useNavigate();

  // ✅ usar useHandleForm
  const { handleSave, handleSaveAndSend } = useHandleForm();

  const handleSelectionElementsUpdate = (
    nextElements: ElementType[],
    nextElementRequests: ElementRequestType[]
  ) => {
    setElements(nextElements);
    setElementRequests(nextElementRequests);
    localStorage.setItem("selectedElements", JSON.stringify(nextElements));
    localStorage.setItem("selectedElementRequest", JSON.stringify(nextElementRequests));
  };

  const handleSelectionWorkersUpdate = (
    nextWorkers: Worker[],
    nextRequestWorkers: RequestWorker[]
  ) => {
    setWorkers(nextWorkers);
    setRequestWorkers(nextRequestWorkers);
    localStorage.setItem("selectedWorkers", JSON.stringify(nextWorkers));
    localStorage.setItem("selectedRequestWorkers", JSON.stringify(nextRequestWorkers));
  };

  const navigateToBack = () => {
    if (projectIdParam) {
      navigate(`/admin/projects/${projectIdParam}/requests`);
    } else {
      navigate(`/admin/requests`);
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedElements: ElementType[] = JSON.parse(localStorage.getItem("selectedElements") || "[]");
      setElements(updatedElements);

      const updatedElementRequests: ElementRequestType[] = JSON.parse(localStorage.getItem("selectedElementRequest") || "[]");
      setElementRequests(updatedElementRequests);

      const updatedWorkers: Worker[] = JSON.parse(localStorage.getItem("selectedWorkers") || "[]");
      const updatedRequestWorkers: RequestWorker[] = JSON.parse(localStorage.getItem("selectedRequestWorkers") || "[]");
      setWorkers(updatedWorkers);
      setRequestWorkers(updatedRequestWorkers);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  
  const handleRemoveElement = (element: ElementType) => {
    const updatedElements = elements.filter((elem) => elem.elementId !== element.elementId);
    const updatedElementRequests = elementRequests.filter((req) => req.elementId !== element.elementId);

    setElements(updatedElements);
    setElementRequests(updatedElementRequests);

    localStorage.setItem("selectedElements", JSON.stringify(updatedElements));
    localStorage.setItem("selectedElementRequest", JSON.stringify(updatedElementRequests));
  };

  const handleChangeElementRequest = (elementId: number, field: keyof ElementRequestType, value: string | number) => {
    const updated = elementRequests.map((req) =>
      req.elementId === elementId ? { ...req, [field]: field === "quantityRequested" ? Number(value) : value } : req
    );
    setElementRequests(updated);
    localStorage.setItem("selectedElementRequest", JSON.stringify(updated));
  };

  const handleChangeRequestWorker = (
    workerId: number,
    field: keyof Pick<RequestWorker, "shirtSize" | "pantsSize" | "shoeSize">,
    value: string
  ) => {
    const updated = requestWorkers.map((rw) =>
      rw.workerId === workerId ? { ...rw, [field]: value } : rw
    );
    setRequestWorkers(updated);
    localStorage.setItem("selectedRequestWorkers", JSON.stringify(updated));
  };

  const handleSaveRequest = async (e : React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (projectId === 0) {
      toast.error("Por favor, selecciona un proyecto.");
      return;
    }

    await toast.promise(
      handleSave(projectId, deliveryDueDate, description),
      {
        loading: "Guardando solicitud...",
        success: (result) => {
          if (result?.data && !result?.loading && !result?.error) {
            setElements([]);
            setElementRequests([]);
            setWorkers([]);
            setRequestWorkers([]);
            localStorage.removeItem("projectId");
            localStorage.removeItem("deliveryDueDate");
            localStorage.removeItem("selectedElements");
            localStorage.removeItem("selectedElementRequest");
            localStorage.removeItem("selectedWorkers");
            localStorage.removeItem("selectedRequestWorkers");
            setTimeout(() => navigateToBack(), 1200);
            return result?.data.request.message || "Solicitud guardada exitosamente.";
          }
          throw new Error("Error al guardar la solicitud.");
        },
        error: (err) => err.message || "Error al guardar la solicitud.",
      }
    );
  };

  const handleSaveAndSendRequest = async () => {
    setOpenPasswordModal(false);

    if (projectId === 0) {
      toast.error("Por favor, selecciona un proyecto.");
      return;
    }

    await toast.promise(
      handleSaveAndSend(projectId, deliveryDueDate, description, passwordCPanel),
      {
        loading: "Guardando y enviando solicitud...",
        success: (result) => {
          if (result) {
            setElements([]);
            setElementRequests([]);
            setWorkers([]);
            setRequestWorkers([]);
            localStorage.removeItem("selectedWorkers");
            localStorage.removeItem("selectedRequestWorkers");
            localStorage.removeItem("projectId");
            localStorage.removeItem("deliveryDueDate");
            localStorage.removeItem("selectedElements");
            localStorage.removeItem("selectedElementRequest");
            setTimeout(() => navigateToBack(), 1200);
            return "Solicitud guardada y enviada exitosamente.";
          }
          throw new Error("Error al guardar y enviar la solicitud.");
        },
        error: (err) => err.message || "Error al guardar y enviar la solicitud.",
      }
    );
  }

  const handleRemoveWorker = (worker: Worker) => {
    const nextWorkers = workers.filter(w => w.workerId !== worker.workerId);
    const nextReqWorkers = requestWorkers.filter(rw => rw.workerId !== worker.workerId);

    setWorkers(nextWorkers);
    setRequestWorkers(nextReqWorkers);

    localStorage.setItem("selectedWorkers", JSON.stringify(nextWorkers));
    localStorage.setItem("selectedRequestWorkers", JSON.stringify(nextReqWorkers));
  };



  if (!projects) {
    return <ErrorMessage errorMessage="Error al cargar los proyectos. Por favor, intenta nuevamente más tarde." />;
  }

  return (
    <>
      <form onSubmit={handleSaveRequest} className="p-10 max-w-7xl text-gray-800 " >

        <h1 className="text-2xl font-bold mb-4">REGISTRAR SOLICITUD</h1>

        <div className="flex flex-col items-start justify-start gap-4 w-full h-full">
          
          <div className="flex flex-col lg:flex-row w-full gap-4">
            <SelectForm
              label="Proyecto"
              name="projectId"
              value={projectId}
              onChange={(value) => setProjectId(Number(value))}
              options={[
                ...projects.map((project) => ({
                  value: project.projectId,
                  label: project.name,
                })),
              ]}
              disabled={!!projectIdParam}
            />

            <InputForm
              label="Fecha y Hora de Entrega"
              name="deliveryDueDate"
              type="datetime-local"
              value={deliveryDueDate}
              onChange={(e) => {setDeliveryDueDate(e.target.value);
              }}>
              <div className="relative flex w-full justify-end">
                <RiQuestionFill className="inline-flex text-amber-500 cursor-pointer size-5" onClick={() => setOpenWarning(!openWarning)} />
                { 
                  openWarning && (
                  <p className="absolute bg-amber-500 p-2 rounded-md text-white font-semibold inline-flex w-78 right-0 top-6 gap-1 mb-1">
                    <IoWarning className="w-8 mt-1" /> 
                    Recuerda que si el requerimiento es para mañana, la hora límite para pedirlo es 1 PM. Si es para pasado mañana, el límite es 5 PM.
                  </p>
                )}
              </div>
            </InputForm>
          </div>

          <div className="flex flex-col w-full gap-4">
            <div className="flex flex-col w-full gap-4">
              <span className="font-semibold mt-4">Busca los elementos que vas a seleccionar:</span>
              <div className="flex flex-row items-center justify-around gap-4 w-full mb-3">
                <RequestTypeCard icon={<FaHelmetSafety className="size-16" />} title="Seguridad" typeElement="epp" onSelected={handleSelectionElementsUpdate} />
                <RequestTypeCard icon={<FaTools className="size-16" />} title="Operativo" typeElement="operative" onSelected={handleSelectionElementsUpdate} />
              </div>
              <div className="flex flex-col items-start gap-2 justify-start overflow-x-auto">
                {
                  elements.length > 0 ? (
                    <div className="min-w-xl w-full">
                    <span className="font-semibold pt-2 pb-4">Elementos seleccionados:</span>
                    <HeaderNewRequest />
                      {elements.map((element) => (
                        <RowElementRequest 
                          key={element.elementId}
                          elementRequest={
                            elementRequests.find(req => req.elementId === element.elementId) || 
                            { unit: "", quantityRequested: 0, elementId: element.elementId!, requestId: 0, element: element }
                          }
                          handleRemoveElement={handleRemoveElement}
                          handleChangeElementRequest={handleChangeElementRequest}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 w-full mb-4">
                      <div className="flex w-full border border-gray-100"></div>
                      <ErrorMessage errorMessage="No hay elementos seleccionados." />
                      <div className="flex w-full border border-gray-100"></div>
                    </div>
                  )
                }
              </div>
            </div>

            <div className="flex flex-row w-full gap-4">
              <div className="flex flex-col w-full gap-4">
                <span className="font-semibold mt-4">Busca los trabajadores que vas a seleccionar:</span>
                <div className="flex flex-row items-center justify-around gap-4 w-full mb-3">
                  <WorkerSelectCard icon={<FaPersonDigging className="size-16" />} title="Obreros" workerType={"laborer"} onSelected={handleSelectionWorkersUpdate} />
                  <WorkerSelectCard icon={<MdEngineering className="size-16" />} title="Técnicos" workerType={"technician"} onSelected={handleSelectionWorkersUpdate} />
                </div>

                {/* Trabajadores seleccionados (editable) */}
                <div className="flex flex-col items-start gap-2 justify-start w-full overflow-x-auto">
                  {workers.length > 0 ? (
                    <div className="min-w-xl w-full">
                      <span className="font-semibold pt-2 pb-2">Trabajadores seleccionados:</span>
                      <HeaderWorkers />
                      {workers.map((w) => {
                        const rw =
                          requestWorkers.find((x) => x.workerId === w.workerId) ||
                          {
                            requestWorkerId: 0,
                            requestId: 0,
                            workerId: w.workerId!,
                            shirtSize: "",
                            pantsSize: "",
                            shoeSize: "",
                            worker: w,
                          };
                        return (
                          <RowRequestWorker
                            key={w.workerId}
                            requestWorker={rw}
                            onRemove={handleRemoveWorker}
                            onChange={handleChangeRequestWorker}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 w-full mb-4">
                      <div className="flex w-full border border-gray-100"></div>
                      <ErrorMessage errorMessage="No hay trabajadores seleccionados." />
                      <div className="flex w-full border border-gray-100"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>


          <TextAreaForm
            label="Descripción"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            optional={true}
          />

          <ButtonContainer>
            <ReturnButton onClick={() => navigateToBack()} />
            <SaveButton loading={false} />
            <Button
              type="button"
              icon={<MdAttachEmail />}
              label="Guardar y Enviar"
              onClick={() => setOpenPasswordModal(true)}
              bgColor="black"
              bgHoverColor="gray-900"
            />
          </ButtonContainer>
        </div>
      </form>
      <Toaster position="top-center" />
      {
        openPasswordModal && (
          <div className={`fixed inset-0 z-50 bg-black/40 flex items-center justify-center transition-all duration-300`}>
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Contraseña del Sistema de Correos</h2>
              <InputForm
                label="Contraseña"
                name="passwordCPanel"
                type="password"
                value={passwordCPanel}
                onChange={(e) => setPasswordCPanel(e.target.value)}
                optional={false}
              />
              <ButtonContainer>
                <Button
                  type="button"
                  label="Cancelar"
                  onClick={() => setOpenPasswordModal(false)}
                  bgColor="red"
                  bgHoverColor="darkred"
                  icon={<TiArrowBack />}
                />
                <Button
                  type="button"
                  label="Enviar"
                  onClick={handleSaveAndSendRequest}
                  bgColor="#0047a3"
                  bgHoverColor="#003a80"
                  icon={<MdAttachEmail />}
                />
              </ButtonContainer>
            </div>
          </div>
        )
      }
    </>
  );
}
