import { ClipboardCheck, Download, Mail, Plus, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonForm } from "../../common/loading";
import { ActionButton, Button } from "../../components";
import { requestApi } from "../../data/apiUrl";
import type {
  ElementRequestType,
  ElementRequestWorkerPlan,
  ElementType,
  RequestType,
  Worker,
} from "../../data/types";
import getAuthHeaders from "../../hooks/getAuthHeaders";
import { useApiAction, useFetch } from "../../hooks";
import { useAccess } from "../../permissions/AccessProvider";
import {
  getInventoryFamilyFromSource,
  type InventoryFamilyTabKey,
} from "../Elements/inventoryCatalog";
import RequestFamilyTabs from "./components/RequestFamilyTabs";
import RequestItemPicker from "./components/RequestItemPicker";
import EpiPlanningModal from "./components/EpiPlanningModal";
import WorkerClothingHistoryModal from "./components/WorkerClothingHistoryModal";

interface Props {
  requestId: number;
}

const familyLabel = (family?: string | null) =>
  family === "uniform"
    ? "Ropa de Trabajo"
    : family === "epp" || family === "epi"
      ? "EPP"
      : "Equipos de Seguridad";

export default function SsomaRequestDetail({ requestId }: Props) {
  const navigate = useNavigate();
  const { can } = useAccess();
  const {
    data: request,
    loading,
    error,
    refetch,
  } = useFetch<RequestType>(`${requestApi}${requestId}`, [requestId]);
  const { execute: addResource, loading: adding } = useApiAction<unknown>();
  const { execute: sendEmail, loading: sending } = useApiAction<unknown>();
  const [historyWorker, setHistoryWorker] = useState<Worker | null>(null);
  const [showAddition, setShowAddition] = useState(false);
  const [additionFamily, setAdditionFamily] =
    useState<InventoryFamilyTabKey>("uniform");
  const [additionElement, setAdditionElement] = useState<
    | (ElementType & {
        selectedVariant?: NonNullable<ElementType["variants"]>[number];
      })
    | null
  >(null);
  const [additionQuantity, setAdditionQuantity] = useState(1);
  const [additionNotes, setAdditionNotes] = useState("");
  const [additionPlans, setAdditionPlans] = useState<
    ElementRequestWorkerPlan[]
  >([]);
  const [showAdditionPlanning, setShowAdditionPlanning] = useState(false);
  const [showMail, setShowMail] = useState(false);
  const [mailPassword, setMailPassword] = useState("");

  const groups = useMemo(() => {
    if (!request) return [];
    return (["uniform", "epp", "ese"] as const).map((key) => ({
      key,
      label: familyLabel(key),
      originals: (request.elementRequests || []).filter((line) => {
        const family = getInventoryFamilyFromSource(line.element);
        return key === "epp"
          ? family === "epp" || family === "epi"
          : family === key;
      }),
      additions: (request.resourceAdditions || []).filter((line) => {
        const family = getInventoryFamilyFromSource(line.element);
        return key === "epp"
          ? family === "epp" || family === "epi"
          : family === key;
      }),
    }));
  }, [request]);

  const additionLine = useMemo<ElementRequestType | null>(() => {
    if (!additionElement || additionFamily !== "uniform") return null;
    return {
      requestId,
      elementId: additionElement.elementId,
      elementVariantId:
        additionElement.selectedVariant?.elementVariantId ?? null,
      quantityRequested: additionQuantity,
      unit: "unidad",
      lineKey: `addition-${additionElement.elementId}-${additionElement.selectedVariant?.elementVariantId ?? "none"}`,
      element: additionElement,
      elementVariant: additionElement.selectedVariant ?? null,
    };
  }, [additionElement, additionFamily, additionQuantity, requestId]);

  if (loading) return <LoadingSkeletonForm numberRows={5} />;
  if (error || !request)
    return (
      <ErrorMessage
        errorMessage={error || "No se encontró el requerimiento."}
      />
    );

  const downloadPdf = async () => {
    const response = await fetch(`${requestApi}pdf/${requestId}`, {
      headers: getAuthHeaders(),
      credentials: "include",
    });
    if (!response.ok) throw new Error("No se pudo descargar el PDF.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `requerimiento-${requestId}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveAddition = async () => {
    if (!additionElement || additionQuantity <= 0) {
      toast.error("Selecciona un recurso e ingresa una cantidad válida.");
      return;
    }
    const plannedQuantity = additionPlans.reduce(
      (total, plan) => total + Number(plan.plannedQuantity || 0),
      0,
    );
    if (plannedQuantity > additionQuantity) {
      toast.error(
        "La cantidad destinada a trabajadores supera la cantidad incorporada.",
      );
      return;
    }
    await toast.promise(
      addResource(`${requestApi}${requestId}/additions`, "POST", {
        elementId: additionElement.elementId,
        elementVariantId: additionElement.selectedVariant?.elementVariantId,
        quantity: additionQuantity,
        unit: "unidad",
        notes: additionNotes || undefined,
        workerPlans: additionPlans.map((plan) => ({
          workerId:
            plan.requestWorker?.workerId || plan.requestWorkerId,
          quantity: Number(plan.plannedQuantity),
        })),
      }),
      {
        loading: "Agregando recurso…",
        success: "Recurso incorporado.",
        error: (caught) => caught.message,
      },
    );
    setShowAddition(false);
    setAdditionElement(null);
    setAdditionQuantity(1);
    setAdditionNotes("");
    setAdditionPlans([]);
    refetch();
  };

  const submitEmail = async () => {
    if (!mailPassword) return;
    const operationId = crypto.randomUUID();
    await toast.promise(
      sendEmail(`${requestApi}sendLogistics`, "POST", {
        requestId,
        passwordCPanel: mailPassword,
        operationId,
      }),
      {
        loading: "Enviando requerimiento…",
        success: "Correo aceptado por el proveedor.",
        error: (caught) => caught.message,
      },
    );
    setShowMail(false);
    setMailPassword("");
    refetch();
  };

  return (
    <main className="w-full px-4 py-6 text-gray-800 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button
              type="button"
              className="mb-2 text-sm text-[#0047a3] hover:underline"
              onClick={() => navigate("/admin/requests")}
            >
              ← Volver a requerimientos
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              Requerimiento SSOMA N.º {request.requestId}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {request.ssomaRequestKind === "projectStart"
                ? "Inicio de Obra"
                : "Durante la Ejecución"}{" "}
              · {request.project?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {can("requests.export") ? (
              <ActionButton
                variant="ghost"
                icon={<Download />}
                label="Descargar PDF"
                onClick={() => void downloadPdf()}
              />
            ) : null}
            {can("requests.sendEmail") ? (
              <ActionButton
                variant="ghost"
                icon={<Mail />}
                label="Enviar por correo"
                onClick={() => setShowMail(true)}
              />
            ) : null}
            {can("requests.addResource") ? (
              <ActionButton
                variant="ghost"
                icon={<Plus />}
                label="Agregar recurso"
                onClick={() => setShowAddition(true)}
              />
            ) : null}
            {request.status !== "draft" &&
            request.status !== "Borrador" &&
            (can("requests.review") ||
              can("requests.approve") ||
              can("requests.attend") ||
              can("requests.manage")) ? (
              <ActionButton
                variant="ghost"
                icon={<ClipboardCheck />}
                label="Gestionar revisión y atención"
                onClick={() =>
                  navigate(`/admin/requests/${requestId}?flow=attention`)
                }
              />
            ) : null}
          </div>
        </header>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <dl className="grid gap-4 text-sm md:grid-cols-4">
            <div>
              <dt className="text-gray-500">PDR solicitante</dt>
              <dd className="font-semibold">
                {request.user
                  ? `${request.user.name} ${request.user.lastName}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Fecha</dt>
              <dd className="font-semibold">
                {new Date(request.createdAt).toLocaleString("es-PE")}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Estado</dt>
              <dd className="font-semibold">{request.status}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Correos</dt>
              <dd className="font-semibold">
                {request.emailSends?.length || 0}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-gray-600">
            {request.description || "Sin observaciones."}
          </p>
        </section>

        {groups.map((group) => (
          <section
            key={group.key}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-3 text-base font-bold text-[#0047a3]">
              {group.label}
            </h2>
            {!group.originals.length && !group.additions.length ? (
              <p className="text-sm text-gray-400">
                Sin recursos en esta familia.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Recurso</th>
                      <th className="px-3 py-2">Variante</th>
                      <th className="px-3 py-2 text-right">Cantidad</th>
                      <th className="px-3 py-2">Origen</th>
                      <th className="px-3 py-2">Trabajadores previstos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.originals.map((line) => (
                      <OriginalLine
                        key={`o-${line.elementRequestId}`}
                        line={line}
                        onWorker={setHistoryWorker}
                      />
                    ))}
                    {group.additions.map((line) => (
                      <tr
                        key={`a-${line.requestResourceAdditionId}`}
                        className="border-t border-gray-100 align-top"
                      >
                        <td className="px-3 py-2 font-medium">
                          {line.element.name}
                        </td>
                        <td className="px-3 py-2">
                          {line.elementVariant?.label || "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {Number(line.quantity)} {line.unit}
                        </td>
                        <td className="px-3 py-2">
                          {line.origin === "logistics"
                            ? "Logística"
                            : "Administración"}
                          <span className="block text-xs text-gray-400">
                            {line.addedByUser
                              ? `${line.addedByUser.name} ${line.addedByUser.lastName}`
                              : ""}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {line.workerPlans?.map((plan) => (
                            <button
                              key={plan.requestResourceAdditionWorkerPlanId}
                              type="button"
                              className="mr-2 text-[#0047a3] hover:underline"
                              onClick={() =>
                                plan.worker && setHistoryWorker(plan.worker)
                              }
                            >
                              {plan.worker?.fullName} (
                              {Number(plan.plannedQuantity)})
                            </button>
                          )) || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}

        {request.workClothingDispatches?.length ? (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">
              Seguimiento logístico
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {request.workClothingDispatches.map((dispatch) => (
                <li
                  key={dispatch.workClothingDispatchId}
                  className="rounded-md bg-gray-50 px-3 py-2"
                >
                  Despacho N.º {dispatch.workClothingDispatchId} ·{" "}
                  {dispatch.status} ·{" "}
                  {dispatch.items.reduce(
                    (sum, item) => sum + Number(item.quantityDispatched),
                    0,
                  )}{" "}
                  unidad(es)
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {request.emailSends?.length ? (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">
              Historial de envíos
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {request.emailSends.map((send) => (
                <li
                  key={send.requestEmailSendId}
                  className="flex flex-wrap justify-between gap-2 rounded-md bg-gray-50 px-3 py-2"
                >
                  <span>
                    {send.isUpdate ? "Actualización" : "Envío inicial"} ·{" "}
                    {new Date(send.createdAt).toLocaleString("es-PE")}
                    <small className="block text-gray-500">
                      {Array.isArray(send.recipients)
                        ? send.recipients.join(", ")
                        : "Destinatarios no disponibles"}
                    </small>
                  </span>
                  <span
                    className={
                      send.status === "accepted"
                        ? "text-emerald-700"
                        : "text-red-700"
                    }
                  >
                    {send.status === "accepted"
                      ? "Aceptado por el proveedor"
                      : "Fallido"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {showAddition ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="addition-title"
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-5"
          >
            <header className="mb-4 flex items-center justify-between">
              <h2 id="addition-title" className="text-lg font-bold">
                Agregar recurso al requerimiento
              </h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setShowAddition(false)}
              >
                <X />
              </button>
            </header>
            <RequestFamilyTabs
              activeFamily={additionFamily}
              onChange={setAdditionFamily}
            />
            <div className="mt-4">
              <RequestItemPicker
                familyKey={additionFamily}
                onAddElement={(element) => {
                  setAdditionElement(element);
                  setAdditionPlans([]);
                }}
              />
            </div>
            {additionElement ? (
              <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm">
                <strong>{additionElement.name}</strong>
                {additionElement.selectedVariant
                  ? ` · ${additionElement.selectedVariant.label}`
                  : ""}
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                Cantidad
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  type="number"
                  min="1"
                  step="1"
                  value={additionQuantity}
                  onChange={(event) =>
                    setAdditionQuantity(Number(event.target.value))
                  }
                />
              </label>
              <label className="text-sm">
                Motivo u observación
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  value={additionNotes}
                  onChange={(event) => setAdditionNotes(event.target.value)}
                />
              </label>
            </div>
            {additionFamily === "uniform" && additionElement ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm">
                <span>
                  {additionPlans.length
                    ? `${additionPlans.length} trabajador(es) previsto(s)`
                    : "Sin destinatarios previstos; toda la cantidad quedará general."}
                </span>
                <Button
                  type="button"
                  icon={<Users />}
                  label="Definir destinatarios"
                  onClick={() => setShowAdditionPlanning(true)}
                  bgColor="#0047a3"
                  bgHoverColor="#003a80"
                />
              </div>
            ) : null}
            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                icon={<Plus />}
                label={adding ? "Agregando…" : "Agregar recurso"}
                disabled={adding}
                onClick={() => void saveAddition()}
                bgColor="#0047a3"
                bgHoverColor="#003a80"
              />
            </div>
          </section>
        </div>
      ) : null}

      <EpiPlanningModal
        open={showAdditionPlanning}
        elementRequest={additionLine}
        requestWorkers={additionPlans.flatMap((plan) =>
          plan.requestWorker ? [plan.requestWorker] : [],
        )}
        plans={additionPlans}
        onClose={() => setShowAdditionPlanning(false)}
        onSave={(plans) => {
          setAdditionPlans(plans);
          setShowAdditionPlanning(false);
        }}
      />

      {showMail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mail-title"
            className="w-full max-w-md rounded-xl bg-white p-5"
          >
            <h2 id="mail-title" className="text-lg font-bold">
              Enviar requerimiento por correo
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Se conservará una copia inmutable del contenido enviado.
            </p>
            <label className="mt-4 block text-sm">
              Contraseña del correo
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={mailPassword}
                onChange={(event) => setMailPassword(event.target.value)}
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                icon={<X />}
                label="Cancelar"
                onClick={() => setShowMail(false)}
                bgColor="gray-600"
                bgHoverColor="gray-700"
              />
              <Button
                type="button"
                icon={<Mail />}
                label={sending ? "Enviando…" : "Enviar"}
                disabled={sending || !mailPassword}
                onClick={() => void submitEmail()}
                bgColor="#0047a3"
                bgHoverColor="#003a80"
              />
            </div>
          </section>
        </div>
      ) : null}

      <WorkerClothingHistoryModal
        worker={historyWorker}
        onClose={() => setHistoryWorker(null)}
      />
      <Toaster position="top-center" />
    </main>
  );
}

function OriginalLine({
  line,
  onWorker,
}: {
  line: ElementRequestType;
  onWorker: (worker: Worker) => void;
}) {
  return (
    <tr className="border-t border-gray-100 align-top">
      <td className="px-3 py-2 font-medium">{line.element?.name}</td>
      <td className="px-3 py-2">{line.elementVariant?.label || "—"}</td>
      <td className="px-3 py-2 text-right">
        {Number(line.quantityRequested)} {line.unit}
      </td>
      <td className="px-3 py-2">Solicitud original del PDR</td>
      <td className="px-3 py-2">
        {line.epiPlans?.length
          ? line.epiPlans.map((plan) => (
              <button
                key={plan.elementRequestWorkerPlanId}
                type="button"
                className="mr-2 text-[#0047a3] hover:underline"
                onClick={() =>
                  plan.requestWorker?.worker &&
                  onWorker(plan.requestWorker.worker)
                }
              >
                {plan.requestWorker?.worker?.fullName} (
                {Number(plan.plannedQuantity)})
              </button>
            ))
          : "Sin destinatario definido"}
      </td>
    </tr>
  );
}
