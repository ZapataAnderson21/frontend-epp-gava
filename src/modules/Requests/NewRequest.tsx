import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoWarning } from "react-icons/io5";
import { RiQuestionFill } from "react-icons/ri";
import { MdAttachEmail } from "react-icons/md";
import { FaHelmetSafety } from "react-icons/fa6";
import { FaTools } from "react-icons/fa";
import { TiArrowBack } from "react-icons/ti";

import RequestTypeCard from "./components/RequestTypeCard";
import type { ElementRequestType, ProjectType, ElementType } from "../../data/types";
import HeaderNewRequest from "./components/HeaderNewRequest";
import RowElementRequest from "./components/RowElementRequest";
import { InputForm, SelectForm, TextAreaForm, RedButton, SaveModal, ButtonContainer, Form, ButtonSubmit } from "../../common/form";
import { projectApi } from "../../data/apiUrl";
import { useFetch, useHandleForm } from "../../hooks";
import { ErrorMessage } from "../../common/error";
import { Button } from "../../components";

export default function NewRequest() {
  const [projectId, setProjectId] = useState<number>(0);
  const [deliveryDueDate, setDeliveryDueDate] = useState<string>(localStorage.getItem("deliveryDueDate") || "");
  const selectedElements: ElementType[] = JSON.parse(localStorage.getItem("selectedElements") || "[]");
  const selectedElementRequest: ElementRequestType[] = JSON.parse(localStorage.getItem("selectedElementRequest") || "[]");
  const [description, setDescription] = useState<string>("");

  const [elements, setElements] = useState<ElementType[]>(selectedElements);
  const [elementRequests, setElementRequests] = useState<ElementRequestType[]>(selectedElementRequest);

  const { data: projects } = useFetch<ProjectType[]>(`${projectApi}status/active`, []);

  const [passwordCPanel, setPasswordCPanel] = useState<string>("");
  const [openPasswordModal, setOpenPasswordModal] = useState<boolean>(false);

  const [successMessage, setSuccessMessage] = useState<string>("");
  const [onOk, setOnOk] = useState<() => void>(() => () => {});
  const [openSaveModal, setOpenSaveModal] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const [openWarning, setOpenWarning] = useState<boolean>(false);

  const navigate = useNavigate();

  // ✅ usar useHandleForm
  const { handleSave, handleSaveAndSend } = useHandleForm();


  const closeModalAndReset = () => {
    setOpenSaveModal(false);
    setError(false);
  };

  const navigateToRequests = () => {
    navigate("/admin/requests");
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedElements: ElementType[] = JSON.parse(localStorage.getItem("selectedElements") || "[]");
      setElements(updatedElements);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
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

  const handleSaveRequest = async (e : React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOpenSaveModal(true);

    if (projectId === 0) {
      await setError(true);
      await setSuccessMessage("Por favor, selecciona un proyecto.");
      await setOnOk(() => closeModalAndReset);
    } 
    
    const result = await handleSave(projectId, deliveryDueDate, description);
    if (result?.data && !result?.loading && !result?.error) {
      setSuccessMessage(result?.data.request.message || "Solicitud guardada exitosamente.");
      setError(false);
      setOnOk(() => navigateToRequests);
      setElements([]);
      setElementRequests([]);
      localStorage.removeItem("projectId");
      localStorage.removeItem("deliveryDueDate");
      localStorage.removeItem("selectedElements");
      localStorage.removeItem("selectedElementRequest");
    } else {
      setError(true);
      setSuccessMessage("Error al guardar la solicitud. Por favor, intenta nuevamente.");
      setOnOk(() => closeModalAndReset);
    }
  };

  const handleSaveAndSendRequest = async () => {

    setOpenPasswordModal(false);
    setOpenSaveModal(true);

    if (projectId === 0) {
      await setError(true);
      await setSuccessMessage("Por favor, selecciona un proyecto.");
      await setOnOk(() => closeModalAndReset);
    } 

    const result = await handleSaveAndSend(projectId, deliveryDueDate, description, passwordCPanel);
    if (result) {
      setSuccessMessage("Solicitud guardada y enviada exitosamente.");
      setError(false);
      setOnOk(() => navigateToRequests);
      setElements([]);
      setElementRequests([]);
      localStorage.removeItem("projectId");
      localStorage.removeItem("deliveryDueDate");
      localStorage.removeItem("selectedElements");
      localStorage.removeItem("selectedElementRequest");
    } else {
      setError(true);
      setSuccessMessage("Error al guardar y enviar la solicitud. Por favor, intenta nuevamente.");
      setOnOk(() => closeModalAndReset);
      setOpenSaveModal(true);
    }
  }

  if (!projects) {
    return <ErrorMessage errorMessage="Error al cargar los proyectos. Por favor, intenta nuevamente más tarde." />;
  }

  return (
    <>
      <Form name="REGISTRAR SOLICITUD" handleSubmit={handleSaveRequest} >

        <div className="flex flex-col items-start justify-start gap-4 w-full max-w-2xl h-full">
          
          <SelectForm
            label="Proyecto"
            name="projectId"
            value={projectId}
            onChange={(value) => setProjectId(Number(value))}
            options={[
              { value: 0, label: "Selecciona un proyecto" },
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

          <span className="font-semibold">Busca los elementos que vas a seleccionar:</span>
          <div className="flex flex-row items-center justify-around gap-4 w-full mb-3">
            <RequestTypeCard icon={<FaHelmetSafety className="size-16" />} title="Seguridad" typeElement="epp" />
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
                      key={element.elementId}
                      elementRequest={
                        elementRequests.find(req => req.elementId === element.elementId) || 
                        { unit: "", quantityRequested: 0, elementId: element.elementId!, requestId: 0, element: element }
                      }
                      handleRemoveElement={handleRemoveElement}
                      handleChangeElementRequest={handleChangeElementRequest}
                    />
                  ))}

                  <TextAreaForm
                    label="Descripción"
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    optional={true}
                  />

                  <ButtonContainer>
                    <ButtonSubmit
                      label="Guardar"
                      loading={false}
                      loadingLabel="Guardando"
                    />
                    <Button
                      label="Guardar y Enviar"
                      href="#"
                      onClick={() => setOpenPasswordModal(true)}
                      bgColor="black"
                      bgHoverColor="gray-900"
                      icon={<MdAttachEmail />}
                    />
                  </ButtonContainer>
                </>
              ) : (
                <div className="flex flex-col gap-2 w-full mb-4">
                  <div className="flex w-full border border-gray-100"></div>
                  <ErrorMessage errorMessage="No hay elementos seleccionados." />
                  <div className="flex w-full border border-gray-100"></div>
                </div>
              )
            }
            <RedButton href="/admin/requests" name="Regresar" />
          </div>
        </div>
      </Form>
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
                  label="Cancelar"
                  href="#"
                  onClick={() => setOpenPasswordModal(false)}
                  bgColor="red"
                  bgHoverColor="darkred"
                  icon={<TiArrowBack />}
                />
                <Button
                  label="Enviar"
                  href="#"
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
      {
        openSaveModal && (
          <SaveModal onOk={onOk} message={successMessage} error={error} />
        )
      }
      </>
  );
}
