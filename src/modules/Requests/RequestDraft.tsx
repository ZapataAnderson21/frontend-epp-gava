import { useEffect, useState } from "react";
import RequestTypeCard from "./components/ModalElements/RequestTypeCard";
import { FaArrowLeft, FaHelmetSafety, FaPersonDigging } from "react-icons/fa6";
import { FaTools } from "react-icons/fa";
import HeaderNewRequest from "./components/HeaderNewRequest";
import RowElementRequest from "./components/RowElementRequest";
import { MdAttachEmail, MdEngineering } from "react-icons/md";
import { ReturnButton, SaveButton } from "../../common/button";
import type { Worker, RequestType, ElementRequestType, Project, RequestWorker, ElementType } from "../../data/types";
import { RiQuestionFill } from "react-icons/ri";
import { IoWarning } from "react-icons/io5";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction, useHandleForm } from "../../hooks";
import { projectApi, requestApi, elementRequestApi, requestWorkerApi } from "../../data/apiUrl";
import { ErrorMessage } from "../../common/error";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ButtonContainer, InputForm, SelectForm, TextAreaForm } from "../../common/form";
import toast, { Toaster } from "react-hot-toast";
import WorkerSelectCard from "./components/ModalWorkers/WorkerSelectCard";
import RowRequestWorker from "./components/RowRequestWorker";
import { Button } from "../../components";
import HeaderWorkers from "./components/HeaderWorkers";
import { localDatetimeToIso, toDatetimeLocalValue } from "../../utils";
export default function RequestDraft() {

  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get("projectId");

  const requestId = window.location.pathname.split("/").pop() || "";

  const [elementRequests, setElementRequests] = useState<ElementRequestType[]>([]);
  const [projectId, setProjectId] = useState<number>(0);
  const { data: projects } = useFetch<Project[]>(`${projectApi}status/active`);
  const [description, setDescription] = useState<string>("");
  const [passwordCPanel, setPasswordCPanel] = useState<string>("");
  const [openPasswordModal, setOpenPasswordModal] = useState<boolean>(false);
  const [, setElements] = useState<ElementType[]>([]);
  const [, setSelectedElementRequest] = useState<ElementRequestType[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [, setSelectedRequestWorkers] = useState<RequestWorker[]>([]);
  const [requestWorkers, setRequestWorkers] = useState<RequestWorker[]>([]);

  const [openWarning, setOpenWarning] = useState<boolean>(false);
  const [deliveryDueDate, setDeliveryDueDate] = useState<string>("");

  // ✅ hooks nuevos
  const { execute: deleteElementRequest } = useApiAction<any>();
  const { data: fetchedRequest } = useFetch<RequestType>(`${requestApi}${requestId}`, [requestId]);
  const { data: fetchedElementRequests } = useFetch<ElementRequestType[]>(`${elementRequestApi}request/${requestId}`, [requestId]);
  const { data: fetchedRequestWorkers } = useFetch<RequestWorker[]>(`${requestWorkerApi}request/${requestId}`, [requestId]);

  const navigate = useNavigate();

  const { handleUpdate, handleUpdateAndSend } = useHandleForm();

  const navigateToBack = () => {
    if (projectIdParam) {
      navigate(`/admin/requests?projectId=${projectIdParam}`);
    } else {
      navigate(`/admin/requests`);
    }
  };

  useEffect(() => {
    if (fetchedRequest) {
      setProjectId(fetchedRequest.projectId);
      setDescription(fetchedRequest.description || "");
      setDeliveryDueDate(
      fetchedRequest.deliveryDueDate ? toDatetimeLocalValue(fetchedRequest.deliveryDueDate) : "");
    }

    if (fetchedElementRequests) {
      setElementRequests(fetchedElementRequests);
      setSelectedElementRequest(fetchedElementRequests);
      const els = fetchedElementRequests.map((er) => er.element).filter((e) => e !== undefined);
      setElements(els);
    }

    if (fetchedRequestWorkers) {
      setRequestWorkers(fetchedRequestWorkers);
      setSelectedRequestWorkers(fetchedRequestWorkers);
      const wrks = fetchedRequestWorkers.map((w) => w.worker).filter((e) => e !== undefined);
      setWorkers(wrks);
    }
  }, [fetchedRequest, fetchedElementRequests, fetchedRequestWorkers]);

  const handleRemoveElement = async (element: ElementType) => {
    try {
      const er = elementRequests.find((x) => x.elementId === element.elementId);
      if (!er?.elementRequestId) {
        setElementRequests((prev) => prev.filter((x) => x.elementId !== element.elementId));
        setSelectedElementRequest((prev) => prev.filter((x) => x.elementId !== element.elementId));
        setElements((prev) => prev.filter((e) => e.elementId !== element.elementId));
        return;
      }

      const res = await deleteElementRequest(`${elementRequestApi}${er.elementRequestId}`, "DELETE");
      if (res.statusCode === 200) {
        setElementRequests((prev) => prev.filter((x) => x.elementRequestId !== er.elementRequestId));
        setSelectedElementRequest((prev) => prev.filter((x) => x.elementRequestId !== er.elementRequestId));
        setElements((prev) => prev.filter((e) => e.elementId !== element.elementId));
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

  const handleUpdateRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (projectId === 0) {
      toast.error("Por favor, selecciona un proyecto.");
      return;
    }

    const deliveryDueDateIso = await localDatetimeToIso(deliveryDueDate);
    if (!deliveryDueDateIso) {
      toast.error("Fecha/hora de entrega inválida.");
      return;
    }

    await toast.promise(
      handleUpdate(Number(requestId), projectId, elementRequests, deliveryDueDateIso, description, requestWorkers),
      {
        loading: "Actualizando solicitud...",
        success: (result) => {
          if (result) {
            setTimeout(() => navigateToBack(), 1200);
            return "Solicitud actualizada exitosamente.";
          }
          throw new Error("Error al actualizar la solicitud.");
        },
        error: (err) => err.message || "Error al actualizar la solicitud.",
      }
    );
  }

  const handleUpdateAndSendRequest = async () => {
    setOpenPasswordModal(false);

    if (projectId === 0) {
      toast.error("Por favor, selecciona un proyecto.");
      return;
    }

    const deliveryDueDateIso = await localDatetimeToIso(deliveryDueDate);
    if (!deliveryDueDateIso) {
      toast.error("Fecha/hora de entrega inválida.");
      return;
    }

    await toast.promise(
      handleUpdateAndSend(Number(requestId), projectId, elementRequests, passwordCPanel, deliveryDueDateIso, description, requestWorkers),
      {
        loading: "Actualizando y enviando solicitud...",
        success: (result) => {
          if (result) {
            setTimeout(() => navigateToBack(), 1200);
            return "Solicitud actualizada y enviada exitosamente.";
          }
          throw new Error("Error al actualizar y enviar la solicitud.");
        },
        error: (err) => err.message || "Error al actualizar y enviar la solicitud.",
      }
    );
  }

  const handleSelectionElementsUpdate = (nextEls: ElementType[], nextReqs: ElementRequestType[]) => {
    setElements(nextEls);
    setElementRequests(nextReqs);
    setSelectedElementRequest(nextReqs);
  };

  const handleSelectionWorkersUpdate = (nextWorkers: Worker[], nextReqWorkers: RequestWorker[]) => {
    setWorkers(nextWorkers);
    setRequestWorkers(nextReqWorkers);
  };

  const handleRemoveWorker = (worker: Worker) => {
    setWorkers((prev) => prev.filter((w) => w.workerId !== worker.workerId));
    setRequestWorkers((prev) => prev.filter((rw) => rw.workerId !== worker.workerId));
  };

  const handleChangeRequestWorker = (
    workerId: number,
    field: keyof Pick<RequestWorker, "shirtSize" | "pantsSize" | "shoeSize">,
    value: string
  ) => {
    setRequestWorkers((prev) =>
      prev.map((rw) => (rw.workerId === workerId ? { ...rw, [field]: value } : rw))
    );
  };


  if (!projects) {
    return <ErrorMessage errorMessage="Error al cargar los proyectos. Por favor, intenta nuevamente más tarde." />;
  }

  return (
    <>
      <form onSubmit={handleUpdateRequest} className="p-10 max-w-7xl text-gray-800 " >

        <h1 className="text-2xl font-bold mb-4">SOLICITUD {requestId}</h1>

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
                  elementRequests.length > 0 ? (
                    <div className="min-w-xl w-full">
                    <span className="font-semibold pt-2 pb-4">Elementos seleccionados:</span>
                    <HeaderNewRequest />
                      {elementRequests.map((er: ElementRequestType) => (
                        <RowElementRequest
                          key={er.elementRequestId ?? `temp-${er.elementId}`}
                          elementRequest={er}
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
                  <WorkerSelectCard icon={<FaPersonDigging className="size-16" />} title="Obreros" workerType="laborer" onSelected={handleSelectionWorkersUpdate} />
                  <WorkerSelectCard icon={<MdEngineering className="size-16" />} title="Técnicos" workerType="technician" onSelected={handleSelectionWorkersUpdate} />
                </div>

                <div className="flex flex-col items-start gap-2 justify-start w-full overflow-x-auto">
                  {workers.length > 0 ? (
                    <div className="min-w-xl w-full">
                      <span className="font-semibold pt-2 pb-2">Trabajadores seleccionados:</span>
                      <HeaderWorkers />
                      {workers.map((w) => {
                        const found = requestWorkers.find((x) => x.workerId === w.workerId);
                        
                        const rw: RequestWorker = found
                          ? { ...found, worker: found.worker ?? w }
                          : {
                              requestWorkerId: 0,
                              requestId: Number(requestId),
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

      {openPasswordModal && (
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
                  icon={<FaArrowLeft/>}
                />
                <Button
                  type="button"
                  label="Enviar"
                  onClick={handleUpdateAndSendRequest}
                  bgColor="#0047a3"
                  bgHoverColor="#003a80"
                  icon={<MdAttachEmail />}
                />
              </ButtonContainer>
          </div>
        </div>
      )}
    </>
  );
}
