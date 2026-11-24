import { useRequestFormDraft } from "../../hooks/useRequestFormDraft";
import PurchaseOrderDraftNotice from "../../common/form/PurchaseOrderDraftNotice";
import type { RequestFormDraftData } from "../../utils/requestFormDraft";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import toast, { Toaster } from "react-hot-toast";

import { ReturnButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { ButtonContainer, SelectForm, TextAreaForm } from "../../common/form";
import { Button } from "../../components";
import { projectApi, requestApi } from "../../data/apiUrl";
import type {
  ElementRequestType,
  ElementRequestWorkerPlan,
  ElementType,
  Project,
  RequestType,
  RequestWorker,
} from "../../data/types";
import { useApiAction, useCurrentUser, useFetch } from "../../hooks";
import {
  formatInventoryQuantity,
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
  getRequestLineFamily,
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
  const [deliveryDueDate, setDeliveryDueDate] = useState(() =>
    new Date().toISOString(),
  );
  const [description, setDescription] = useState("");
  const [ssomaRequestKind, setSsomaRequestKind] = useState<
    "projectStart" | "duringExecution" | ""
  >("");
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [clientRequestId, setClientRequestId] = useState<string>(() =>
    crypto.randomUUID(),
  );
  const [createdRequestId, setCreatedRequestId] = useState<number | null>(null);
  const snapshot: RequestFormDraftData = {
    schemaVersion: 1,
    clientRequestId,
    createdRequestId,
    projectId,
    deliveryDueDate,
    description,
    ssomaRequestKind,
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
      setClientRequestId(data.clientRequestId || crypto.randomUUID());
      setProjectId(data.projectId);
      setDeliveryDueDate(data.deliveryDueDate);
      setDescription(data.description);
      setSsomaRequestKind(data.ssomaRequestKind || "");
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
  const navigate = useNavigate();
  const { execute: createSsomaRequest } = useApiAction<RequestType>();

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

    if (activeFamily !== "harness") {
      const selectedVariant = (
        element as ElementType & {
          selectedVariant?: NonNullable<ElementType["variants"]>[number];
        }
      ).selectedVariant;
      const selectedVariantId = selectedVariant?.elementVariantId ?? null;
      const existingLine = elementRequests.find(
        (requestLine) =>
          requestLine.elementId === element.elementId &&
          (requestLine.elementVariantId ?? null) === selectedVariantId,
      );

      if (existingLine) {
        const nextElementRequests = elementRequests.map((requestLine) =>
          getRequestLineKey(requestLine) === getRequestLineKey(existingLine)
            ? {
                ...requestLine,
                element,
                elementVariant: selectedVariant ?? requestLine.elementVariant,
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
    delete nextPlans[lineKey];
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
      [getRequestLineKey(planningElement)]: plans,
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

  const saveForm = async () => {
    if (saving) return;
    if (!projectId) {
      toast.error("Por favor, selecciona un proyecto.");
      return;
    }
    if (!ssomaRequestKind) {
      toast.error("Selecciona el tipo de requerimiento.");
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
    if (!elementRequests.length) {
      toast.error("Agrega al menos un recurso SSOMA.");
      return;
    }
    setSaving(true);
    try {
      const result = await toast.promise(
        createSsomaRequest(`${requestApi}ssoma`, "POST", {
          clientRequestId,
          projectId,
          ssomaRequestKind,
          deliveryDueDate,
          description,
          lines: elementRequests.map((line) => {
            const plans =
              elementPlans[getRequestLineKey(line)] ||
              elementPlans[String(line.elementId)] ||
              [];
            return {
              elementId: line.elementId,
              elementVariantId: line.elementVariantId || undefined,
              quantity: Number(line.quantityRequested),
              unit: line.unit || "unidad",
              notes: line.notes || undefined,
              workerPlans: plans
                .filter(
                  (plan) =>
                    Number(plan.plannedQuantity) > 0 &&
                    Boolean(plan.requestWorker?.workerId),
                )
                .map((plan) => ({
                  workerId: plan.requestWorker?.workerId,
                  quantity: Number(plan.plannedQuantity),
                })),
            };
          }),
        }),
        {
          loading: "Registrando requerimiento...",
          success: "Requerimiento registrado exitosamente.",
          error: (err) =>
            err.message || "No se pudo registrar el requerimiento.",
        },
      );
      setCreatedRequestId(result.data.requestId);
      await draft.complete();
      navigate(`/admin/requests/${result.data.requestId}`, { replace: true });
    } catch {
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };
  const handleSaveRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < 3) {
      setStep((current) => (current + 1) as 2 | 3);
      return;
    }
    void saveForm();
  };

  const visibleElementRequests = useMemo(
    () =>
      elementRequests.filter((requestLine) => {
        const family = getInventoryFamilyFromSource(requestLine.element);
        if (activeFamily === "epp") {
          return ["epp", "epi"].includes(family);
        }
        return family === activeFamily;
      }),
    [activeFamily, elementRequests],
  );

  const planningSummary = (line: ElementRequestType) => {
    const plans =
      elementPlans[getRequestLineKey(line)] ||
      elementPlans[String(line.elementId)] ||
      [];
    const planned = plans.reduce(
      (total, plan) => total + Number(plan.plannedQuantity || 0),
      0,
    );
    return plans.length
      ? `${plans.length} trabajador(es), ${formatInventoryQuantity(planned)} planificado`
      : "Sin planificacion";
  };

  if (!projects) {
    return (
      <ErrorMessage errorMessage="Error al cargar los proyectos. Por favor, intenta nuevamente mas tarde." />
    );
  }

  const project = projects.find((item) => item.projectId === projectId);
  const groupedReview = (["uniform", "epp", "ese"] as const).map((family) => ({
    family,
    label:
      family === "uniform"
        ? "Ropa de Trabajo"
        : family === "epp"
          ? "EPP"
          : "Equipos de Seguridad",
    lines: elementRequests.filter((line) => {
      const lineFamily = getRequestLineFamily(line);
      return family === "epp"
        ? lineFamily === "epp" || lineFamily === "epi"
        : lineFamily === family;
    }),
  }));

  const continueToNextStep = () => {
    if (step === 1 && (!projectId || !ssomaRequestKind)) {
      toast.error("Selecciona el tipo de requerimiento y el proyecto.");
      return;
    }
    if (step === 2 && elementRequests.length === 0) {
      toast.error("Agrega al menos un recurso SSOMA.");
      return;
    }
    setStep((current) => Math.min(3, current + 1) as 1 | 2 | 3);
  };

  return (
    <>
      <form
        onSubmit={handleSaveRequest}
        className="w-full px-4 py-6 text-gray-800 sm:px-8 lg:px-10"
      >
        <fieldset disabled={saving} inert={saving} className="contents">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Registrar requerimiento SSOMA
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Completa los datos, agrega los recursos y revisa antes de
                registrar.
              </p>
            </div>

            <ol
              className="grid grid-cols-3 gap-2"
              aria-label="Progreso del formulario"
            >
              {["Datos generales", "Recursos SSOMA", "Revisar y registrar"].map(
                (label, index) => {
                  const currentStep = index + 1;
                  return (
                    <li
                      key={label}
                      className={`rounded-md border px-3 py-2 text-xs font-semibold ${
                        step === currentStep
                          ? "border-[#0047a3] bg-blue-50 text-[#0047a3]"
                          : step > currentStep
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 text-gray-500"
                      }`}
                      aria-current={step === currentStep ? "step" : undefined}
                    >
                      {currentStep}. {label}
                    </li>
                  );
                },
              )}
            </ol>

            <PurchaseOrderDraftNotice draft={draft} requirement />

            {step === 1 ? (
              <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-base font-bold text-gray-900">
                  Datos generales
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectForm
                    label="Tipo de requerimiento"
                    name="ssomaRequestKind"
                    value={ssomaRequestKind}
                    onChange={(value) =>
                      setSsomaRequestKind(
                        value as "projectStart" | "duringExecution" | "",
                      )
                    }
                    options={[
                      { value: "", label: "Seleccionar" },
                      { value: "projectStart", label: "Inicio de Obra" },
                      {
                        value: "duringExecution",
                        label: "Durante la Ejecución",
                      },
                    ]}
                  />
                  <SelectForm
                    label="Proyecto u obra"
                    name="projectId"
                    value={projectId}
                    onChange={(value) => setProjectId(Number(value))}
                    options={projects.map((item) => ({
                      value: item.projectId,
                      label: item.name,
                    }))}
                    disabled={Boolean(projectIdParam)}
                  />
                </div>
                <div className="mt-4">
                  <TextAreaForm
                    label="Observaciones generales"
                    name="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    optional
                  />
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Fecha de registro:{" "}
                  {new Date(deliveryDueDate).toLocaleDateString("es-PE")}. El
                  PDR solicitante se obtiene de tu sesión.
                </p>
              </section>
            ) : null}

            {step === 2 ? (
              <section className="flex flex-col gap-4">
                <RequestFamilyTabs
                  activeFamily={activeFamily}
                  onChange={setActiveFamily}
                />
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-900">
                      {getRequestFamilyDescription(activeFamily)}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {activeFamily === "uniform"
                        ? "Agrupa las prendas por artículo y talla y planifica destinatarios cuando corresponda."
                        : "Agrega recursos del catálogo SSOMA. Los artículos repetidos se acumulan en una sola fila."}
                    </p>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
                    <div className="min-w-0 overflow-x-auto">
                      {visibleElementRequests.length ? (
                        <div className="min-w-[720px]">
                          <HeaderNewRequest
                            showDetailsColumn={activeFamily === "uniform"}
                            showQuantityColumn
                          />
                          {visibleElementRequests.map((line) => (
                            <RowElementRequest
                              key={getRequestLineKey(line)}
                              elementRequest={line}
                              handleRemoveElement={handleRemoveElement}
                              handleChangeElementRequest={
                                handleChangeElementRequest
                              }
                              showPlanningButton={
                                getRequestLineFamily(line) === "uniform"
                              }
                              planningSummary={
                                getRequestLineFamily(line) === "uniform"
                                  ? planningSummary(line)
                                  : undefined
                              }
                              onOpenPlanning={openPlanning}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex min-h-52 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                          No hay recursos seleccionados en esta familia.
                        </div>
                      )}
                    </div>
                    <RequestItemPicker
                      familyKey={activeFamily}
                      onAddElement={handleAddElementFromPanel}
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {step === 3 ? (
              <section className="flex flex-col gap-5 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Revisar requerimiento
                  </h2>
                  <dl className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                    <div>
                      <dt className="text-gray-500">Tipo</dt>
                      <dd className="font-semibold">
                        {ssomaRequestKind === "projectStart"
                          ? "Inicio de Obra"
                          : "Durante la Ejecución"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Proyecto</dt>
                      <dd className="font-semibold">{project?.name || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">PDR</dt>
                      <dd className="font-semibold">Usuario autenticado</dd>
                    </div>
                  </dl>
                  {description ? (
                    <p className="mt-3 text-sm text-gray-600">{description}</p>
                  ) : null}
                </div>
                {groupedReview.map((group) => (
                  <div key={group.family}>
                    <h3 className="mb-2 text-sm font-bold text-[#0047a3]">
                      {group.label}
                    </h3>
                    {group.lines.length ? (
                      <div className="overflow-x-auto rounded-md border border-gray-200">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-left text-xs text-gray-500">
                            <tr>
                              <th className="px-3 py-2">Recurso</th>
                              <th className="px-3 py-2">Variante</th>
                              <th className="px-3 py-2 text-right">Cantidad</th>
                              <th className="px-3 py-2">
                                Destinatarios previstos
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.lines.map((line) => {
                              const plans =
                                elementPlans[getRequestLineKey(line)] ||
                                elementPlans[String(line.elementId)] ||
                                [];
                              const planned = plans.reduce(
                                (sum, plan) =>
                                  sum + Number(plan.plannedQuantity || 0),
                                0,
                              );
                              return (
                                <tr
                                  key={getRequestLineKey(line)}
                                  className="border-t border-gray-100"
                                >
                                  <td className="px-3 py-2 font-medium">
                                    {line.element?.name}
                                  </td>
                                  <td className="px-3 py-2">
                                    {line.elementVariant?.label || "—"}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {formatInventoryQuantity(
                                      Number(line.quantityRequested),
                                    )}{" "}
                                    {line.unit}
                                  </td>
                                  <td className="px-3 py-2">
                                    {plans.length
                                      ? `${plans.length} trabajador(es); ${formatInventoryQuantity(Number(line.quantityRequested) - planned)} sin destinatario`
                                      : "Sin destinatario definido"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Sin recursos.</p>
                    )}
                  </div>
                ))}
              </section>
            ) : null}

            <ButtonContainer>
              {step === 1 ? (
                <ReturnButton onClick={navigateToBack} />
              ) : (
                <Button
                  type="button"
                  label="Anterior"
                  icon={<ChevronLeft />}
                  onClick={() => setStep((current) => (current - 1) as 1 | 2)}
                  bgColor="gray-600"
                  bgHoverColor="gray-700"
                />
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  label="Continuar"
                  icon={<ChevronRight />}
                  onClick={continueToNextStep}
                  bgColor="#0047a3"
                  bgHoverColor="#003a80"
                />
              ) : (
                <Button
                  permission="requests.manage"
                  type="submit"
                  label={saving ? "Registrando…" : "Registrar requerimiento"}
                  icon={<Check />}
                  disabled={saving}
                  bgColor="#0047a3"
                  bgHoverColor="#003a80"
                />
              )}
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
              ? elementPlans[getRequestLineKey(planningElement)] ||
                elementPlans[String(planningElement.elementId)] ||
                []
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
    </>
  );
}
