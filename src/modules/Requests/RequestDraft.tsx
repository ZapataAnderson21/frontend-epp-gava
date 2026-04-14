import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { RiQuestionFill } from "react-icons/ri";
import { IoWarning } from "react-icons/io5";
import { MdAttachEmail } from "react-icons/md";
import toast, { Toaster } from "react-hot-toast";
import { TiArrowBack } from "react-icons/ti";

import type {
  ElementRequestType,
  ElementRequestWorkerPlan,
  Project,
  RequestType,
  RequestWorker,
} from "../../data/types";
import { useApiAction, useFetch, useHandleForm } from "../../hooks";
import { ErrorMessage } from "../../common/error";
import { Button } from "../../components";
import { ButtonContainer, InputForm, SelectForm, TextAreaForm } from "../../common/form";
import { ReturnButton, SaveButton } from "../../common/button";
import {
  elementRequestApi,
  projectApi,
  requestApi,
} from "../../data/apiUrl";
import HeaderNewRequest from "./components/HeaderNewRequest";
import RowElementRequest from "./components/RowElementRequest";
import RequestTypeCard from "./components/ModalElements/RequestTypeCard";
import RequestFamilyTabs from "./components/RequestFamilyTabs";
import EpiPlanningModal from "./components/EpiPlanningModal";
import {
  formatInventoryQuantity,
  getInventoryFamilyConfig,
  getInventoryFamilyFromSource,
  type InventoryFamilyTabKey,
} from "../Elements/inventoryCatalog";
import { getRequestFamilyDescription, getRequestFamilyTab } from "./requestFamilies";
import {
  buildRequestWorkersFromPlans,
  prunePlansByElementRequests,
  type ElementPlanState,
} from "./requestPlanning";
import { toDatetimeLocalValue } from "../../utils";

function buildPlanState(elementRequests: ElementRequestType[]) {
  return elementRequests.reduce<ElementPlanState>((acc, elementRequest) => {
    acc[String(elementRequest.elementId)] = elementRequest.epiPlans || [];
    return acc;
  }, {});
}

export default function RequestDraft() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const projectIdParam = searchParams.get("projectId");
  const cameFromProject = location.state?.fromProject as number | undefined;
  const requestId = Number(window.location.pathname.split("/").pop() || "0");

  const [projectId, setProjectId] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
  const [deliveryDueDate, setDeliveryDueDate] = useState<string>("");
  const [activeFamily, setActiveFamily] = useState<InventoryFamilyTabKey>("epp");
  const [elementRequests, setElementRequests] = useState<ElementRequestType[]>([]);
  const [requestWorkers, setRequestWorkers] = useState<RequestWorker[]>([]);
  const [elementPlans, setElementPlans] = useState<ElementPlanState>({});
  const [planningElement, setPlanningElement] = useState<ElementRequestType | null>(null);
  const [passwordCPanel, setPasswordCPanel] = useState<string>("");
  const [openPasswordModal, setOpenPasswordModal] = useState<boolean>(false);
  const [openWarning, setOpenWarning] = useState<boolean>(false);

  const { execute: deleteElementRequest } = useApiAction<any>();
  const { data: request, loading, error } = useFetch<RequestType>(
    requestId ? `${requestApi}${requestId}` : "",
    [requestId],
  );
  const { data: projects } = useFetch<Project[]>(`${projectApi}status/active`);
  const navigate = useNavigate();
  const { handleUpdate, handleUpdateAndSend } = useHandleForm();

  useEffect(() => {
    if (!request) return;

    setProjectId(request.projectId);
    setDescription(request.description || "");
    setDeliveryDueDate(
      request.deliveryDueDate ? toDatetimeLocalValue(request.deliveryDueDate) : "",
    );

    const nextElementRequests = request.elementRequests || [];
    const nextRequestWorkers = request.requestWorkers || [];
    setElementRequests(nextElementRequests);
    setRequestWorkers(nextRequestWorkers);
    setElementPlans(buildPlanState(nextElementRequests));
  }, [request]);

  const navigateToBack = () => {
    if (cameFromProject) {
      navigate(`/admin/projects/${cameFromProject}/requests`);
      return;
    }

    if (projectIdParam) {
      navigate(`/admin/projects/${projectIdParam}/requests`);
      return;
    }

    navigate("/admin/requests");
  };

  const handleSelectionElementsUpdate = (
    _nextElements: any[],
    nextElementRequests: ElementRequestType[],
  ) => {
    setElementRequests(nextElementRequests);

    const nextPlans = prunePlansByElementRequests(elementPlans, nextElementRequests);
    const nextRequestWorkers = buildRequestWorkersFromPlans(nextPlans, requestWorkers);
    setElementPlans(nextPlans);
    setRequestWorkers(nextRequestWorkers);
  };

  const handleRemoveElement = async (element: any) => {
    try {
      const current = elementRequests.find((item) => item.elementId === element.elementId);
      if (!current?.elementRequestId) return;

      const response = await deleteElementRequest(
        `${elementRequestApi}${current.elementRequestId}`,
        "DELETE",
      );

      if (response.statusCode === 200) {
        const nextElementRequests = elementRequests.filter(
          (item) => item.elementId !== element.elementId,
        );
        const nextPlans = { ...elementPlans };
        delete nextPlans[String(element.elementId)];
        const nextRequestWorkers = buildRequestWorkersFromPlans(nextPlans, requestWorkers);
        setElementRequests(nextElementRequests);
        setElementPlans(nextPlans);
        setRequestWorkers(nextRequestWorkers);
      }
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar el item.");
    }
  };

  const handleChangeElementRequest = (
    elementId: number,
    field: keyof ElementRequestType,
    value: string | number,
  ) => {
    setElementRequests((current) =>
      current.map((elementRequest) =>
        elementRequest.elementId === elementId
          ? {
              ...elementRequest,
              [field]:
                field === "quantityRequested"
                  ? Number(value)
                  : value,
            }
          : elementRequest,
      ),
    );
  };

  const handleSavePlans = (plans: ElementRequestWorkerPlan[]) => {
    if (!planningElement) return;

    const nextPlans = {
      ...elementPlans,
      [String(planningElement.elementId)]: plans,
    };
    const nextRequestWorkers = buildRequestWorkersFromPlans(nextPlans, requestWorkers);

    setElementPlans(nextPlans);
    setRequestWorkers(nextRequestWorkers);
    setPlanningElement(null);
  };

  const handleUpdateRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await toast.promise(
      handleUpdate(
        requestId,
        projectId,
        elementRequests,
        deliveryDueDate,
        description,
        requestWorkers,
        request?.requestWorkers || [],
        elementPlans,
      ),
      {
        loading: "Actualizando solicitud...",
        success: () => {
          setTimeout(() => navigateToBack(), 1200);
          return "Solicitud actualizada exitosamente.";
        },
        error: (err) => err.message || "No se pudo actualizar la solicitud.",
      },
    );
  };

  const handleUpdateAndSendRequest = async () => {
    setOpenPasswordModal(false);

    await toast.promise(
      handleUpdateAndSend(
        requestId,
        projectId,
        elementRequests,
        passwordCPanel,
        deliveryDueDate,
        description,
        requestWorkers,
        request?.requestWorkers || [],
        elementPlans,
      ),
      {
        loading: "Actualizando y enviando solicitud...",
        success: () => {
          setTimeout(() => navigateToBack(), 1200);
          return "Solicitud actualizada y enviada exitosamente.";
        },
        error: (err) => err.message || "No se pudo actualizar y enviar la solicitud.",
      },
    );
  };

  const visibleElementRequests = useMemo(
    () =>
      elementRequests.filter(
        (elementRequest) => getInventoryFamilyFromSource(elementRequest.element) === activeFamily,
      ),
    [activeFamily, elementRequests],
  );

  const planningSummary = (elementId: number) => {
    const plans = elementPlans[String(elementId)] || [];
    const planned = plans.reduce((total, plan) => total + Number(plan.plannedQuantity || 0), 0);
    return plans.length
      ? `${plans.length} trabajador(es), ${formatInventoryQuantity(planned)} planificado`
      : "Sin planificacion";
  };

  const selectedFamilyConfig = getInventoryFamilyConfig(activeFamily);
  const activeFamilyCard = getRequestFamilyTab(activeFamily);

  if (loading) return <ErrorMessage errorMessage="Cargando requerimiento..." />;
  if (error || !request) {
    return <ErrorMessage errorMessage={error || "No se encontro el requerimiento."} />;
  }
  if (!projects) {
    return <ErrorMessage errorMessage="No se pudieron cargar los proyectos." />;
  }

  return (
    <>
      <form onSubmit={handleUpdateRequest} className="max-w-7xl p-10 text-gray-800">
        <h1 className="mb-4 text-2xl font-bold">EDITAR SOLICITUD</h1>

        <div className="flex h-full w-full flex-col items-start justify-start gap-4">
          <div className="flex w-full flex-col gap-4 lg:flex-row">
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
              disabled={Boolean(projectIdParam)}
            />

            <InputForm
              label="Fecha y Hora de Entrega"
              name="deliveryDueDate"
              type="datetime-local"
              value={deliveryDueDate}
              onChange={(e) => setDeliveryDueDate(e.target.value)}
            >
              <div className="relative flex w-full justify-end">
                <RiQuestionFill
                  className="inline-flex size-5 cursor-pointer text-amber-500"
                  onClick={() => setOpenWarning(!openWarning)}
                />
                {openWarning ? (
                  <p className="absolute right-0 top-6 mb-1 inline-flex w-78 gap-1 rounded-md bg-amber-500 p-2 font-semibold text-white">
                    <IoWarning className="mt-1 w-8" />
                    Recuerda que si el requerimiento es para mañana, la hora limite para pedirlo es 1 PM. Si es para pasado mañana, el limite es 5 PM.
                  </p>
                ) : null}
              </div>
            </InputForm>
          </div>

          <div className="flex w-full flex-col gap-4">
            <TextAreaForm
              label="Descripcion"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              optional={true}
            />

            <RequestFamilyTabs activeFamily={activeFamily} onChange={setActiveFamily} />

            <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {getRequestFamilyDescription(activeFamily)}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedFamilyConfig?.requiresCode
                    ? "Mantiene unidades unicas con codigo obligatorio."
                    : selectedFamilyConfig?.consumable
                      ? "Permite cantidades decimales y retornos parciales."
                      : "Puedes ajustar cantidades y mantener la trazabilidad del borrador."}
                </p>
              </div>

              {activeFamilyCard ? (
                <div className="max-w-sm">
                  <RequestTypeCard
                    icon={activeFamilyCard.icon}
                    title={`Seleccionar ${activeFamilyCard.label}`}
                    familyKey={activeFamily}
                    onSelected={handleSelectionElementsUpdate}
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-2 overflow-x-auto">
                {visibleElementRequests.length > 0 ? (
                  <div className="w-full min-w-xl">
                    <span className="pb-4 pt-2 font-semibold">Items seleccionados:</span>
                    <HeaderNewRequest showDetailsColumn={activeFamily === "epi"} />
                    {visibleElementRequests.map((elementRequest) => (
                      <RowElementRequest
                        key={`${activeFamily}-${elementRequest.elementId}`}
                        elementRequest={elementRequest}
                        handleRemoveElement={handleRemoveElement}
                        handleChangeElementRequest={handleChangeElementRequest}
                        showPlanningButton={activeFamily === "epi"}
                        planningSummary={activeFamily === "epi" ? planningSummary(elementRequest.elementId) : undefined}
                        onOpenPlanning={setPlanningElement}
                        allowDecimals={activeFamily === "consumibles"}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mb-4 flex w-full flex-col gap-2">
                    <div className="flex w-full border border-gray-100" />
                    <ErrorMessage errorMessage={`No hay items seleccionados en ${selectedFamilyConfig?.label || "esta familia"}.`} />
                    <div className="flex w-full border border-gray-100" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <ButtonContainer>
            <ReturnButton onClick={navigateToBack} />
            <SaveButton loading={false} />
            <Button
              type="button"
              icon={<MdAttachEmail />}
              label="Actualizar y Enviar"
              onClick={() => setOpenPasswordModal(true)}
              bgColor="black"
              bgHoverColor="gray-900"
            />
          </ButtonContainer>
        </div>
      </form>

      <EpiPlanningModal
        open={Boolean(planningElement)}
        elementRequest={planningElement}
        requestWorkers={requestWorkers}
        plans={planningElement ? elementPlans[String(planningElement.elementId)] || [] : []}
        onClose={() => setPlanningElement(null)}
        onSave={handleSavePlans}
      />

      <Toaster position="top-center" />

      {openPasswordModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-all duration-300">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Contraseña del Sistema de Correos</h2>
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
                onClick={handleUpdateAndSendRequest}
                bgColor="#0047a3"
                bgHoverColor="#003a80"
                icon={<MdAttachEmail />}
              />
            </ButtonContainer>
          </div>
        </div>
      ) : null}
    </>
  );
}
