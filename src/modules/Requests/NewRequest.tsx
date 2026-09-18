import { useRequestFormDraft } from "../../hooks/useRequestFormDraft";
import PurchaseOrderDraftNotice from "../../common/form/PurchaseOrderDraftNotice";
import type { RequestFormDraftData } from "../../utils/requestFormDraft";
import {
  TriangleAlert as IoWarning,
  MailPlus as MdAttachEmail,
  CircleHelp as RiQuestionFill,
  ArrowLeft as TiArrowBack,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import toast, { Toaster } from "react-hot-toast";

import { ReturnButton, SaveButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import {
  ButtonContainer,
  InputForm,
  SelectForm,
  TextAreaForm,
} from "../../common/form";
import { Button } from "../../components";
import { projectApi } from "../../data/apiUrl";
import type {
  ElementRequestType,
  ElementRequestWorkerPlan,
  ElementType,
  Project,
  RequestWorker,
} from "../../data/types";
import { useCurrentUser, useFetch, useHandleForm } from "../../hooks";
import {
  formatInventoryQuantity,
  getInventoryFamilyConfig,
  getInventoryFamilyFromSource,
  type InventoryFamilyTabKey,
} from "../Elements/inventoryCatalog";
import EpiPlanningModal from "./components/EpiPlanningModal";
import HeaderNewRequest from "./components/HeaderNewRequest";
import RequestFamilyTabs from "./components/RequestFamilyTabs";
import RequestItemPicker from "./components/RequestItemPicker";
import RowElementRequest from "./components/RowElementRequest";
import { getRequestFamilyDescription } from "./requestFamilies";
import {
  attachRequestLineKeys,
  createElementRequestLine,
  getRequestLineKey,
  getUniqueElementsFromLines,
} from "./requestLineUtils";
import {
  buildRequestWorkersFromPlans,
  prunePlansByElementRequests,
  type ElementPlanState,
} from "./requestPlanning";

export default function NewRequest() {
  const { user, error } = useCurrentUser();
  const [params] = useSearchParams();
  if (!user)
    return <ErrorMessage errorMessage={error || "Cargando usuario..."} />;
  return (
    <NewRequestForm
      key={`${user.userId}:${params.get("projectId") || "new"}`}
      userId={user.userId}
    />
  );
}
function NewRequestForm({ userId }: { userId: number }) {
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get("projectId");
  const [projectId, setProjectId] = useState(
    projectIdParam ? Number(projectIdParam) : 0,
  );
  const [deliveryDueDate, setDeliveryDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [activeFamily, setActiveFamily] =
    useState<InventoryFamilyTabKey>("epp");
  const [elementPlans, setElementPlans] = useState<ElementPlanState>({});
  const [planningElement, setPlanningElement] =
    useState<ElementRequestType | null>(null);
  const [pendingPlanning, setPendingPlanning] =
    useState<RequestFormDraftData["pendingPlanning"]>(null);
  const [elementRequests, setElementRequests] = useState<ElementRequestType[]>(
    [],
  );
  const [requestWorkers, setRequestWorkers] = useState<RequestWorker[]>([]);
  const elements = getUniqueElementsFromLines(elementRequests);
  const [saving, setSaving] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<number | null>(null);
  const snapshot: RequestFormDraftData = {
    schemaVersion: 1,
    createdRequestId,
    projectId,
    deliveryDueDate,
    description,
    activeFamily,
    elementRequests,
    requestWorkers,
    elementPlans,
    pendingPlanning,
  };
  const draft = useRequestFormDraft({
    userId,
    slot: projectIdParam ? `project-${projectIdParam}` : "new",
    value: snapshot,
    restore: (data) => {
      setCreatedRequestId(data.createdRequestId);
      setProjectId(data.projectId);
      setDeliveryDueDate(data.deliveryDueDate);
      setDescription(data.description);
      setActiveFamily(data.activeFamily);
      setElementRequests(data.elementRequests);
      setRequestWorkers(data.requestWorkers);
      setElementPlans(data.elementPlans);
      setPendingPlanning(data.pendingPlanning);
      setPlanningElement(null);
    },
  });

  const { data: projects } = useFetch<Project[]>(
    `${projectApi}status/active`,
    [],
  );
  const [passwordCPanel, setPasswordCPanel] = useState<string>("");
  const [openPasswordModal, setOpenPasswordModal] = useState<boolean>(false);
  const [openWarning, setOpenWarning] = useState<boolean>(false);

  const navigate = useNavigate();
  const { handleSave, handleSend, handleUpdate } = useHandleForm();

  const handleSelectionElementsUpdate = (
    _nextElements: ElementType[],
    nextElementRequests: ElementRequestType[],
  ) => {
    const normalizedLines = attachRequestLineKeys(nextElementRequests);
    const nextPlans = prunePlansByElementRequests(
      elementPlans,
      normalizedLines,
    );
    const nextRequestWorkers = buildRequestWorkersFromPlans(
      nextPlans,
      requestWorkers,
    );

    setElementRequests(normalizedLines);
    setElementPlans(nextPlans);
    setRequestWorkers(nextRequestWorkers);
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
                quantityRequested:
                  Number(requestLine.quantityRequested || 0) + 1,
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

  const handleRemoveElement = (lineKey: string) => {
    if (pendingPlanning?.lineKey === lineKey) setPendingPlanning(null);
    const updatedElementRequests = elementRequests.filter(
      (requestLine) => getRequestLineKey(requestLine) !== lineKey,
    );
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
    const nextRequestWorkers = buildRequestWorkersFromPlans(
      nextPlans,
      requestWorkers,
    );

    setElementRequests(updatedElementRequests);
    setElementPlans(nextPlans);
    setRequestWorkers(nextRequestWorkers);
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
            [field]: field === "quantityRequested" ? Number(value) : value,
          }
        : requestLine,
    );

    setElementRequests(updated);
  };

  const openPlanning = (line: ElementRequestType) => {
    if (
      pendingPlanning &&
      pendingPlanning.lineKey !== getRequestLineKey(line)
    ) {
      toast.error("Primero guarda los detalles de la planificación pendiente.");
      setPlanningElement(
        elementRequests.find(
          (item) => getRequestLineKey(item) === pendingPlanning.lineKey,
        ) ?? null,
      );
      return;
    }
    setPlanningElement(line);
  };

  const handleSavePlans = (plans: ElementRequestWorkerPlan[]) => {
    if (!planningElement) return;

    const nextPlans = {
      ...elementPlans,
      [String(planningElement.elementId)]: plans,
    };
    const nextRequestWorkers = buildRequestWorkersFromPlans(
      nextPlans,
      requestWorkers,
    );

    setElementPlans(nextPlans);
    setRequestWorkers(nextRequestWorkers);
    setPendingPlanning(null);
    setPlanningElement(null);
  };

  const saveForm = async (send: boolean) => {
    if (saving) return;
    if (!projectId) {
      toast.error("Por favor, selecciona un proyecto.");
      return;
    }
    if (["conflict", "invalid"].includes(draft.status)) {
      toast.error("Resuelve el aviso del borrador antes de guardar.");
      return;
    }
    if (pendingPlanning) {
      toast.error(
        "Revisa y guarda la planificación pendiente antes de guardar el requerimiento.",
      );
      return;
    }
    if (send && !passwordCPanel) {
      toast.error("Ingresa la contraseña del correo.");
      return;
    }
    setOpenPasswordModal(false);
    setSaving(true);
    let savedId: number | null = null;
    try {
      await toast.promise(
        (async () => {
          const result = createdRequestId
            ? await handleUpdate(
                createdRequestId,
                projectId,
                elementRequests,
                deliveryDueDate,
                description,
                requestWorkers,
                [],
                elementPlans,
              )
            : await handleSave(projectId, deliveryDueDate, description, {
                data: snapshot,
                onCreated: setCreatedRequestId,
              });
          if (!result?.data || result.error)
            throw new Error("No se pudo guardar el requerimiento.");
          savedId = result.data.request.requestId;
          await draft.complete();
          if (send) await handleSend(savedId, passwordCPanel);
        })(),
        {
          loading: send
            ? "Guardando y enviando solicitud..."
            : "Guardando solicitud...",
          success: send
            ? "Solicitud guardada y enviada exitosamente."
            : "Solicitud guardada exitosamente.",
          error: (err) =>
            savedId
              ? `Solicitud N° ${savedId} guardada; no se pudo enviar el correo. ${err.message}`
              : err.message || "No se pudo guardar la solicitud.",
        },
      );
      setTimeout(navigateToBack, 1200);
    } catch {
      if (savedId)
        setTimeout(() => navigate(`/admin/requests/${savedId}`), 1200);
      else setSaving(false);
    } finally {
      setPasswordCPanel("");
    }
  };
  const handleSaveRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveForm(false);
  };
  const handleSaveAndSendRequest = () => {
    void saveForm(true);
  };

  const visibleElementRequests = useMemo(
    () =>
      elementRequests.filter((requestLine) => {
        const family = getInventoryFamilyFromSource(requestLine.element);
        if (activeFamily === "epp") {
          return ["epp", "epi", "uniform"].includes(family);
        }
        return family === activeFamily;
      }),
    [activeFamily, elementRequests],
  );

  const planningSummary = (elementId: number) => {
    const plans = elementPlans[String(elementId)] || [];
    const planned = plans.reduce(
      (total, plan) => total + Number(plan.plannedQuantity || 0),
      0,
    );
    return plans.length
      ? `${plans.length} trabajador(es), ${formatInventoryQuantity(planned)} planificado`
      : "Sin planificacion";
  };

  const selectedFamilyConfig = getInventoryFamilyConfig(activeFamily);

  if (!projects) {
    return (
      <ErrorMessage errorMessage="Error al cargar los proyectos. Por favor, intenta nuevamente mas tarde." />
    );
  }

  return (
    <>
      <form onSubmit={handleSaveRequest} className="w-full p-10 text-gray-800">
        <fieldset disabled={saving} inert={saving} className="contents">
          <h1 className="mb-4 text-xl font-bold">REGISTRAR SOLICITUD</h1>
          <PurchaseOrderDraftNotice draft={draft} requirement />
          {pendingPlanning && (
            <button
              type="button"
              className="my-2 underline"
              onClick={() =>
                setPlanningElement(
                  elementRequests.find(
                    (line) =>
                      getRequestLineKey(line) === pendingPlanning.lineKey,
                  ) ?? null,
                )
              }
            >
              Revisar planificación pendiente
            </button>
          )}

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
                        Recuerda que si el requerimiento es para mañana, la hora
                        limite para pedirlo es 1 PM. Si es para pasado mañana,
                        el limite es 5 PM.
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
              <RequestFamilyTabs
                activeFamily={activeFamily}
                onChange={setActiveFamily}
              />

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
                          showDetailsColumn={visibleElementRequests.some(
                            (line) =>
                              getInventoryFamilyFromSource(line.element) ===
                              "epi",
                          )}
                          showQuantityColumn={activeFamily !== "harness"}
                        />
                        {visibleElementRequests.map((elementRequest) => (
                          <RowElementRequest
                            key={getRequestLineKey(elementRequest)}
                            elementRequest={elementRequest}
                            handleRemoveElement={handleRemoveElement}
                            handleChangeElementRequest={
                              handleChangeElementRequest
                            }
                            showPlanningButton={
                              getInventoryFamilyFromSource(
                                elementRequest.element,
                              ) === "epi"
                            }
                            planningSummary={
                              getInventoryFamilyFromSource(
                                elementRequest.element,
                              ) === "epi"
                                ? planningSummary(elementRequest.elementId)
                                : undefined
                            }
                            onOpenPlanning={openPlanning}
                            showQuantityField={activeFamily !== "harness"}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex min-h-[14rem] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-xs text-gray-500">
                        No hay items seleccionados en{" "}
                        {selectedFamilyConfig?.label || "esta familia"}.
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
              <SaveButton loading={saving} />
              <Button
                permission="requests.manage"
                type="button"
                icon={<MdAttachEmail />}
                label="Guardar y Enviar"
                onClick={() => setOpenPasswordModal(true)}
                bgColor="black"
                bgHoverColor="gray-900"
              />
            </ButtonContainer>
          </div>
        </fieldset>
      </form>

      <EpiPlanningModal
        open={Boolean(planningElement)}
        elementRequest={planningElement}
        requestWorkers={requestWorkers}
        plans={
          planningElement &&
          pendingPlanning?.lineKey === getRequestLineKey(planningElement)
            ? pendingPlanning.plans
            : planningElement
              ? elementPlans[String(planningElement.elementId)] || []
              : []
        }
        onClose={() => setPlanningElement(null)}
        onDraftChange={(plans) => {
          if (planningElement)
            setPendingPlanning({
              lineKey: getRequestLineKey(planningElement),
              plans,
            });
        }}
        onSave={handleSavePlans}
      />

      <Toaster position="top-center" />

      {openPasswordModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-all duration-300">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">
              Contraseña del Sistema de Correos
            </h2>
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
