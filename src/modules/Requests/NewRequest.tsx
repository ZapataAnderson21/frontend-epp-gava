import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft as TiArrowBack,
  CircleHelp as RiQuestionFill,
  MailPlus as MdAttachEmail,
  TriangleAlert as IoWarning,
} from "lucide-react";



import toast, { Toaster } from "react-hot-toast";

import type {
  ElementRequestType,
  ElementRequestWorkerPlan,
  ElementType,
  Project,
  RequestWorker,
} from "../../data/types";
import HeaderNewRequest from "./components/HeaderNewRequest";
import RowElementRequest from "./components/RowElementRequest";
import { InputForm, SelectForm, TextAreaForm, ButtonContainer } from "../../common/form";
import { projectApi } from "../../data/apiUrl";
import { useFetch, useHandleForm } from "../../hooks";
import { ErrorMessage } from "../../common/error";
import { Button } from "../../components";
import { ReturnButton, SaveButton } from "../../common/button";
import RequestFamilyTabs from "./components/RequestFamilyTabs";
import EpiPlanningModal from "./components/EpiPlanningModal";
import RequestItemPicker from "./components/RequestItemPicker";
import {
  formatInventoryQuantity,
  getInventoryFamilyConfig,
  getInventoryFamilyFromSource,
  type InventoryFamilyTabKey,
} from "../Elements/inventoryCatalog";
import { getRequestFamilyDescription } from "./requestFamilies";
import {
  buildRequestWorkersFromPlans,
  prunePlansByElementRequests,
  type ElementPlanState,
} from "./requestPlanning";
import {
  attachRequestLineKeys,
  createElementRequestLine,
  getRequestLineKey,
  getUniqueElementsFromLines,
} from "./requestLineUtils";

function parsePlansFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("selectedElementRequestPlans") || "{}") as ElementPlanState;
  } catch {
    return {};
  }
}

export default function NewRequest() {
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get("projectId");

  const [projectId, setProjectId] = useState<number>(projectIdParam ? Number(projectIdParam) : 0);
  const [deliveryDueDate, setDeliveryDueDate] = useState<string>(localStorage.getItem("deliveryDueDate") || "");
  const [description, setDescription] = useState<string>("");
  const [activeFamily, setActiveFamily] = useState<InventoryFamilyTabKey>("epp");
  const [elementPlans, setElementPlans] = useState<ElementPlanState>(parsePlansFromStorage());
  const [planningElement, setPlanningElement] = useState<ElementRequestType | null>(null);

  const selectedElements: ElementType[] = JSON.parse(localStorage.getItem("selectedElements") || "[]");
  const selectedElementRequest: ElementRequestType[] = attachRequestLineKeys(
    JSON.parse(localStorage.getItem("selectedElementRequest") || "[]"),
  );
  const selectedRequestWorkers: RequestWorker[] = JSON.parse(localStorage.getItem("selectedRequestWorkers") || "[]");

  const [elements, setElements] = useState<ElementType[]>(selectedElements);
  const [elementRequests, setElementRequests] = useState<ElementRequestType[]>(selectedElementRequest);
  const [requestWorkers, setRequestWorkers] = useState<RequestWorker[]>(selectedRequestWorkers);

  const { data: projects } = useFetch<Project[]>(`${projectApi}status/active`, []);
  const [passwordCPanel, setPasswordCPanel] = useState<string>("");
  const [openPasswordModal, setOpenPasswordModal] = useState<boolean>(false);
  const [openWarning, setOpenWarning] = useState<boolean>(false);

  const navigate = useNavigate();
  const { handleSave, handleSaveAndSend } = useHandleForm();

  const handleSelectionElementsUpdate = (
    nextElements: ElementType[],
    nextElementRequests: ElementRequestType[],
  ) => {
    const normalizedLines = attachRequestLineKeys(nextElementRequests);
    const normalizedElements = getUniqueElementsFromLines(normalizedLines, nextElements);
    const nextPlans = prunePlansByElementRequests(elementPlans, normalizedLines);
    const nextRequestWorkers = buildRequestWorkersFromPlans(nextPlans, requestWorkers);

    setElements(normalizedElements);
    setElementRequests(normalizedLines);
    setElementPlans(nextPlans);
    setRequestWorkers(nextRequestWorkers);
    localStorage.setItem("selectedElements", JSON.stringify(normalizedElements));
    localStorage.setItem("selectedElementRequest", JSON.stringify(normalizedLines));
    localStorage.setItem("selectedElementRequestPlans", JSON.stringify(nextPlans));
    localStorage.setItem("selectedRequestWorkers", JSON.stringify(nextRequestWorkers));
  };

  const handleAddElementFromPanel = (element: ElementType) => {
    if (activeFamily === "harness" && element.fallProtectionGroupId) {
      const existingLine = elementRequests.find(
        (requestLine) =>
          requestLine.fallProtectionGroupId === element.fallProtectionGroupId,
      );

      if (existingLine) return;
    }

    if (activeFamily === "ese") {
      const existingLine = elementRequests.find(
        (requestLine) => requestLine.elementId === element.elementId,
      );

      if (existingLine) {
        const nextElementRequests = elementRequests.map((requestLine) =>
          getRequestLineKey(requestLine) === getRequestLineKey(existingLine)
            ? {
                ...requestLine,
                element,
                quantityRequested: Number(requestLine.quantityRequested || 0) + 1,
              }
            : requestLine,
        );
        const nextElements = getUniqueElementsFromLines(nextElementRequests, [
          ...elements,
          element,
        ]);
        handleSelectionElementsUpdate(nextElements, nextElementRequests);
        return;
      }
    }

    const nextElementRequests = attachRequestLineKeys([
      ...elementRequests,
      createElementRequestLine(element),
    ]);
    const nextElements = getUniqueElementsFromLines(nextElementRequests, [
      ...elements,
      element,
    ]);

    handleSelectionElementsUpdate(nextElements, nextElementRequests);
  };

  const navigateToBack = () => {
    if (projectIdParam) {
      navigate(`/admin/projects/${projectIdParam}/requests`);
      return;
    }

    navigate(`/admin/requests`);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setElements(JSON.parse(localStorage.getItem("selectedElements") || "[]"));
      setElementRequests(
        attachRequestLineKeys(
          JSON.parse(localStorage.getItem("selectedElementRequest") || "[]"),
        ),
      );
      setRequestWorkers(JSON.parse(localStorage.getItem("selectedRequestWorkers") || "[]"));
      setElementPlans(parsePlansFromStorage());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleRemoveElement = (lineKey: string) => {
    const updatedElementRequests = elementRequests.filter(
      (requestLine) => getRequestLineKey(requestLine) !== lineKey,
    );
    const updatedElements = getUniqueElementsFromLines(updatedElementRequests, elements);
    const removedLine = elementRequests.find(
      (requestLine) => getRequestLineKey(requestLine) === lineKey,
    );
    const nextPlans = { ...elementPlans };
    if (
      removedLine &&
      !updatedElementRequests.some(
        (requestLine) => requestLine.elementId === removedLine.elementId,
      )
    ) {
      delete nextPlans[String(removedLine.elementId)];
    }
    const nextRequestWorkers = buildRequestWorkersFromPlans(nextPlans, requestWorkers);

    setElements(updatedElements);
    setElementRequests(updatedElementRequests);
    setElementPlans(nextPlans);
    setRequestWorkers(nextRequestWorkers);

    localStorage.setItem("selectedElements", JSON.stringify(updatedElements));
    localStorage.setItem("selectedElementRequest", JSON.stringify(updatedElementRequests));
    localStorage.setItem("selectedElementRequestPlans", JSON.stringify(nextPlans));
    localStorage.setItem("selectedRequestWorkers", JSON.stringify(nextRequestWorkers));
  };

  const handleChangeElementRequest = (
    lineKey: string,
    field: keyof ElementRequestType,
    value: string | number | null,
  ) => {
    const updated = elementRequests.map((requestLine) =>
      getRequestLineKey(requestLine) === lineKey
        ? {
            ...requestLine,
            [field]:
              field === "quantityRequested"
                ? Number(value)
                : value,
          }
        : requestLine,
    );

    setElementRequests(updated);
    localStorage.setItem("selectedElementRequest", JSON.stringify(updated));
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
    localStorage.setItem("selectedElementRequestPlans", JSON.stringify(nextPlans));
    localStorage.setItem("selectedRequestWorkers", JSON.stringify(nextRequestWorkers));
    setPlanningElement(null);
  };

  const handleSaveRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (projectId === 0) {
      toast.error("Por favor, selecciona un proyecto.");
      return;
    }

    try {
      await toast.promise(handleSave(projectId, deliveryDueDate, description), {
        loading: "Guardando solicitud...",
        success: (result) => {
          if (result?.data && !result?.loading && !result?.error) {
            setElements([]);
            setElementRequests([]);
            setRequestWorkers([]);
            setElementPlans({});
            localStorage.removeItem("projectId");
            localStorage.removeItem("deliveryDueDate");
            setTimeout(() => navigateToBack(), 1200);
            return result?.data.request.message || "Solicitud guardada exitosamente.";
          }

          throw new Error("Error al guardar la solicitud.");
        },
        error: (err) => err.message || "Error al guardar la solicitud.",
      });
    } catch {
      // El toast ya muestra el error; evitamos promesas sin capturar en consola.
    }
  };

  const handleSaveAndSendRequest = async () => {
    setOpenPasswordModal(false);

    if (projectId === 0) {
      toast.error("Por favor, selecciona un proyecto.");
      return;
    }

    try {
      await toast.promise(
        handleSaveAndSend(projectId, deliveryDueDate, description, passwordCPanel),
        {
          loading: "Guardando y enviando solicitud...",
          success: () => {
            setElements([]);
            setElementRequests([]);
            setRequestWorkers([]);
            setElementPlans({});
            localStorage.removeItem("projectId");
            localStorage.removeItem("deliveryDueDate");
            setTimeout(() => navigateToBack(), 1200);
            return "Solicitud guardada y enviada exitosamente.";
          },
          error: (err) => err.message || "Error al guardar y enviar la solicitud.",
        },
      );
    } catch {
      // El toast ya muestra el error; evitamos promesas sin capturar en consola.
    }
  };

  const visibleElementRequests = useMemo(
    () =>
      elementRequests.filter(
        (requestLine) => {
          const family = getInventoryFamilyFromSource(requestLine.element);
          if (activeFamily === "epp") {
            return ["epp", "epi", "uniform"].includes(family);
          }
          return family === activeFamily;
        },
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

  if (!projects) {
    return <ErrorMessage errorMessage="Error al cargar los proyectos. Por favor, intenta nuevamente mas tarde." />;
  }

  return (
    <>
      <form onSubmit={handleSaveRequest} className="w-full p-10 text-gray-800">
        <h1 className="mb-4 text-xl font-bold">REGISTRAR SOLICITUD</h1>

        <div className="flex h-full w-full flex-col items-start justify-start gap-4">
          <div className="flex max-w-4xl w-full flex-col gap-4">
            <div className="w-full flex flex-row gap-4">
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
            <div className="w-full">
              <TextAreaForm
                label="Descripcion"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                optional={true}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full">

            <RequestFamilyTabs activeFamily={activeFamily} onChange={setActiveFamily} />

            <div className="flex flex-col gap-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-gray-900">
                  {getRequestFamilyDescription(activeFamily)}
                </h2>
                <p className="text-xs text-gray-500">
                  {selectedFamilyConfig?.requiresCode
                    ? "Selecciona unidades con codigo obligatorio."
                    : activeFamily === "ese"
                      ? "Se pide el tipo y la cantidad; el stock disponible no bloquea el pedido."
                      : activeFamily === "harness"
                        ? "Selecciona el grupo EPA."
                        : "Unidad fija: unidad. Registra cantidad y una descripcion opcional."}
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="flex min-w-0 flex-col gap-2 overflow-x-auto">
                  {visibleElementRequests.length > 0 ? (
                    <div className="w-full">
                      <HeaderNewRequest
                        showDetailsColumn={activeFamily === "epi"}
                        showQuantityColumn={activeFamily !== "harness"}
                      />
                      {visibleElementRequests.map((elementRequest) => (
                        <RowElementRequest
                          key={getRequestLineKey(elementRequest)}
                          elementRequest={elementRequest}
                          handleRemoveElement={handleRemoveElement}
                          handleChangeElementRequest={handleChangeElementRequest}
                          showPlanningButton={activeFamily === "epi"}
                          planningSummary={activeFamily === "epi" ? planningSummary(elementRequest.elementId) : undefined}
                          onOpenPlanning={setPlanningElement}
                          showQuantityField={activeFamily !== "harness"}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-[14rem] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-xs text-gray-500">
                      No hay items seleccionados en {selectedFamilyConfig?.label || "esta familia"}.
                    </div>
                  )}
                </div>

                <RequestItemPicker
                  familyKey={activeFamily}
                  onAddElement={handleAddElementFromPanel}
                />
              </div>
            </div>
          </div>

          <ButtonContainer>
            <ReturnButton onClick={navigateToBack} />
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
            <h2 className="mb-4 text-lg font-semibold">Contraseña del Sistema de Correos</h2>
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
      ) : null}
    </>
  );
}
