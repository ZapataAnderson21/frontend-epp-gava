import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  ElementInventoryDetail,
  ElementType,
  InventoryMovement,
  OfficeInventoryEntry,
  UpdateElementDto,
} from "../../data/types";
import LoadingSkeletonForm from "../../common/loading/LoadingSkeletonForm";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction } from "../../hooks/useApiAction";
import { useCurrentUser } from "../../hooks";
import { elementApi, inventoryApi } from "../../data/apiUrl";
import { DeleteConfirmDialog } from "../../components";
import {
  ButtonContainer,
  Form,
  InputForm,
  SelectForm,
  TextAreaForm,
} from "../../common/form";
import { DeleteButton, ReturnButton, SaveButton, SeeButton } from "../../common/button";
import { Table } from "../../common/table";
import toast, { Toaster } from "react-hot-toast";
import { FaFileLines } from "react-icons/fa6";
import type { InventoryFamilyKey } from "./inventoryCatalog";
import {
  formatInventoryQuantity,
  getInventoryBackendPayload,
  getInventoryCodeRequirementLabel,
  getInventoryFamilyConfig,
  getInventoryFamilyFromSource,
  getInventoryFamilyLabel,
  isLegacyOperativeSource,
  usesInventoryStockFields,
} from "./inventoryCatalog";

const NEW_SAFETY_TYPE_VALUE = "__new_safety_type__";
type MovementModalMode = "entry" | "disposal" | "adjustment";
type CurrentInventoryLocationRow = {
  id: string;
  locationType: "office" | "project";
  projectId?: number;
  locationName: string;
  responsibleName?: string | null;
  unit: string;
  quantity: number;
};

export default function Element() {
  const elementId = Number(useParams<{ id: string }>().id ?? 0);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [family, setFamily] = useState<InventoryFamilyKey>("epp");
  const [categoryName, setCategoryName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [size, setSize] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [technicalSheetLink, setTechnicalSheetLink] = useState("");
  const [operationalStatus, setOperationalStatus] = useState("operativo");
  const [manufactureDate, setManufactureDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [stockMinimum, setStockMinimum] = useState(0);
  const [description, setDescription] = useState("");
  const [safetyTypeSelection, setSafetyTypeSelection] = useState("");
  const [movementModal, setMovementModal] = useState<MovementModalMode | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<InventoryMovement | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: element,
    loading,
    error: fetchError,
  } = useFetch<ElementType>(`${elementApi}${elementId}`, [elementId]);
  const { data: existingElements } = useFetch<ElementType[]>(elementApi, []);
  const {
    data: inventoryDetail,
    loading: loadingInventory,
    error: inventoryError,
    refetch: refetchInventoryDetail,
  } = useFetch<ElementInventoryDetail>(`${inventoryApi}element/${elementId}`, [elementId]);

  const { execute: updateElement, loading: updating } = useApiAction<ElementType>();
  const { execute: deleteElement, loading: deleting } = useApiAction<ElementType>();
  const { execute: executeMovement, loading: registeringMovement } = useApiAction<unknown>();
  const { user } = useCurrentUser();

  useEffect(() => {
    if (!element) return;

    setName(element.name);
    setCode(element.code || "");
    setFamily(getInventoryFamilyFromSource(element));
    setCategoryName(element.categoryName || "");
    setBrand(element.brand || "");
    setModel(element.model || "");
    setSize(element.size || "");
    setSerialNumber(element.serialNumber || element.code || "");
    setTechnicalSheetLink(element.technicalSheetLink || "");
    setOperationalStatus(element.operationalStatus || "operativo");
    setManufactureDate(element.manufactureDate?.slice(0, 10) || "");
    setExpirationDate(element.expirationDate?.slice(0, 10) || "");
    setSafetyTypeSelection(
      getInventoryFamilyFromSource(element) === "ese"
        ? element.categoryName || element.name
        : "",
    );
    setStockMinimum(element.stockMinimum || 0);
    setDescription(element.description);
  }, [element]);

  const familyConfig = useMemo(() => getInventoryFamilyConfig(family), [family]);
  const usesStockFields = useMemo(() => usesInventoryStockFields(family), [family]);
  const isSafetyEquipment = family === "ese";
  const isProtectionElement = family === "epp" || family === "epi" || family === "uniform";
  const isOfficeMaterial = family === "officeMaterial";
  const isSsomaSupply = family === "ssomaSupply";
  const isStockCatalogElement = isProtectionElement || isOfficeMaterial || isSsomaSupply;
  const supportsStockMinimum = usesStockFields && !isSsomaSupply;
  const isFallProtection = family === "harness";
  const canRegisterStockMovements = !familyConfig?.unique && !isSafetyEquipment;
  const isLegacyOperative = isLegacyOperativeSource(element);
  const existingSafetyTypes = useMemo(
    () =>
      Array.from(
        new Set(
          (existingElements || [])
            .filter((item) => getInventoryFamilyFromSource(item) === "ese")
            .map((item) => item.categoryName || item.name)
            .filter((value): value is string => Boolean(value?.trim())),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [existingElements],
  );

  const navigateToInventory = (targetFamily: InventoryFamilyKey = family) => {
    navigate(`/admin/inventory/${targetFamily}`);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const codeRequired = familyConfig?.requiresCode ?? false;

    if (codeRequired && !code.trim()) {
      toast.error(`El codigo es obligatorio para ${selectedFamilyLabel}.`);
      return;
    }

    const backendPayload = getInventoryBackendPayload(family);
    const selectedSafetyType = safetyTypeSelection === NEW_SAFETY_TYPE_VALUE
      ? name.trim()
      : safetyTypeSelection;

    if (isSafetyEquipment && !selectedSafetyType) {
      toast.error("Selecciona un tipo de equipo o registra uno nuevo.");
      return;
    }

    const normalizedFallProtectionCategory = categoryName.trim();

    if (isFallProtection && (!code.trim() || !normalizedFallProtectionCategory)) {
      toast.error("Indica el codigo del elemento y la categoria EPA.");
      return;
    }

    const updatedData: UpdateElementDto = {
      name: isSafetyEquipment
        ? selectedSafetyType
        : isFallProtection
          ? normalizedFallProtectionCategory || code.trim()
          : name,
      description,
      code: isSafetyEquipment ? serialNumber.trim() || null : code.trim() || null,
      family: backendPayload.family,
      categoryName: isSafetyEquipment
        ? selectedSafetyType
        : isProtectionElement || isSsomaSupply
          ? categoryName.trim() || null
          : null,
      stockMinimum: supportsStockMinimum ? stockMinimum : 0,
      type: backendPayload.type,
      controlType: backendPayload.controlType,
      brand: brand.trim() || null,
      model: model.trim() || null,
      size: isProtectionElement ? size.trim() || null : null,
      serialNumber: isSafetyEquipment || isFallProtection
        ? serialNumber.trim() || null
        : null,
      technicalSheetLink: technicalSheetLink.trim() || null,
      operationalStatus: isSafetyEquipment || isFallProtection ? operationalStatus : null,
      manufactureDate: manufactureDate || null,
      expirationDate: expirationDate || null,
    };

    toast.promise(updateElement(`${elementApi}${elementId}`, "PATCH", updatedData), {
      loading: "Actualizando item de inventario...",
      success: (result) => {
        setTimeout(() => navigateToInventory(family), 1200);
        return result.message || "Item actualizado con exito";
      },
      error: (err) => err.message || "Error al actualizar el item",
    });
  };

  const handleConfirmDelete = async () => {
    toast.promise(deleteElement(`${elementApi}${elementId}`, "DELETE"), {
      loading: "Eliminando item de inventario...",
      success: (result) => {
        setIsDeleteDialogOpen(false);
        setTimeout(() => navigateToInventory(isLegacyOperative ? "operative" : family), 1000);
        return result.message || "Item eliminado correctamente";
      },
      error: (err) => err.message || "Error al eliminar el item",
    });
  };

  const currentLocationColumns = useMemo(
    () =>
      [
        { key: "locationName", label: "Ubicacion", width: "16rem" },
        {
          key: "responsibleName",
          label: "Responsable",
          width: "14rem",
          render: (row: CurrentInventoryLocationRow) =>
            row.responsibleName || "Sin responsable",
        },
        { key: "unit", label: "Unidad", width: "7rem" },
        {
          key: "quantity",
          label: "Actual",
          width: "6rem",
          align: "center",
          render: (row: CurrentInventoryLocationRow) => formatInventoryQuantity(row.quantity),
        },
        {
          label: "Ver",
          width: "6rem",
          render: (row: CurrentInventoryLocationRow) =>
            row.locationType === "project" && row.projectId ? (
              <SeeButton onClick={() => navigate(`/admin/projects/${row.projectId}/inventory`)} />
            ) : (
              <span className="text-gray-400">-</span>
            ),
        },
      ] as const,
    [navigate],
  );

  const movementColumns = [
    {
      key: "createdAt",
      label: "Fecha",
      width: "12rem",
      render: (row: InventoryMovement) => formatMovementDate(row.createdAt),
    },
    {
      key: "movementType",
      label: "Movimiento",
      width: "12rem",
      render: (row: InventoryMovement) => (
        <MovementTypeBadge
          movementType={row.movementType}
          onClick={() => setSelectedMovement(row)}
        />
      ),
    },
    {
      key: "projectName",
      label: "Proyecto",
      width: "16rem",
      render: (row: InventoryMovement) => row.projectName || "-",
    },
    {
      key: "quantity",
      label: "Cantidad",
      width: "6rem",
      align: "center",
      render: (row: InventoryMovement) => formatInventoryQuantity(row.quantity),
    },
    {
      key: "responsibleUserName",
      label: "Responsable",
      width: "14rem",
      render: (row: InventoryMovement) => row.responsibleUserName || "-",
    },
    {
      key: "performedByUserName",
      label: "Registrado por",
      width: "14rem",
      render: (row: InventoryMovement) => row.performedByUserName || "-",
    },
    {
      label: "Detalle",
      width: "6rem",
      align: "center",
      render: (row: InventoryMovement) => (
        <SeeButton onClick={() => setSelectedMovement(row)} />
      ),
    },
  ] as const;

  if (loading) return <LoadingSkeletonForm numberRows={3} />;
  if (fetchError) return <div className="text-red-500">{fetchError}</div>;

  const selectedFamilyLabel = getInventoryFamilyLabel(family);
  const codeRequirementLabel = getInventoryCodeRequirementLabel(family);
  const assetSummary = element?.assetSummary;
  const availableOfficeEntries =
    inventoryDetail?.officeEntries?.filter((entry) => entry.status !== "disposed") ?? [];

  const handleMovementSubmit = async (payload: {
    officeInventoryEntryId?: number;
    quantity?: number;
    newQuantity?: number;
    reason?: string;
    notes?: string;
  }) => {
    if (!canRegisterStockMovements) {
      toast.error("Este item es unico; no permite ingresos, salidas ni ajustes manuales de stock.");
      return;
    }

    if (!movementModal || !user?.userId) {
      toast.error("No se pudo identificar al usuario que registra el movimiento.");
      return;
    }

    const notes = payload.notes?.trim() || undefined;
    let endpoint = "";
    let body: Record<string, unknown> = {
      performedByUserId: user.userId,
      notes,
    };

    if (movementModal === "entry") {
      endpoint = `${inventoryApi}office/entry`;
      body = {
        ...body,
        elementId,
        quantity: payload.quantity,
        unit: "unidad",
      };
    } else if (movementModal === "disposal" && payload.officeInventoryEntryId) {
      endpoint = `${inventoryApi}office/${payload.officeInventoryEntryId}/dispose`;
      body = {
        ...body,
        quantity: payload.quantity,
        reason: payload.reason,
      };
    } else if (movementModal === "adjustment" && payload.officeInventoryEntryId) {
      endpoint = `${inventoryApi}office/${payload.officeInventoryEntryId}/adjust`;
      body = {
        ...body,
        newQuantity: payload.newQuantity,
        reason: payload.reason,
      };
    } else {
      toast.error("Selecciona un registro de inventario de oficina.");
      return;
    }

    toast.promise(executeMovement(endpoint, "POST", body), {
      loading: "Registrando movimiento...",
      success: (result) => {
        setMovementModal(null);
        void refetchInventoryDetail();
        return result.message || "Movimiento registrado correctamente";
      },
      error: (err) => err.message || "Error al registrar el movimiento",
    });
  };

  const totalOfficeStock = inventoryDetail
    ? inventoryDetail.summary.totalOfficeStock
      ?? inventoryDetail.officeEntries.reduce(
        (total, entry) => total + entry.currentStock,
        0,
      )
    : 0;
  const totalProjectStock = inventoryDetail?.summary.totalPending ?? 0;
  const totalInventoryStock = totalOfficeStock + totalProjectStock;
  const currentLocationRows = inventoryDetail
    ? buildCurrentLocationRows(inventoryDetail, totalOfficeStock)
    : [];
  const deleteDialog = (
    <DeleteConfirmDialog
      isOpen={isDeleteDialogOpen}
      title="Eliminar item de inventario"
      message={`Se archivara "${element?.name || "este item"}" mediante soft delete. No se perdera el historial de requerimientos, movimientos ni trazabilidad asociados. Desea continuar?`}
      confirmText="Eliminar"
      loading={deleting}
      onConfirm={handleConfirmDelete}
      onCancel={() => setIsDeleteDialogOpen(false)}
    />
  );

  if (isStockCatalogElement) {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        <div className="grid gap-10 p-10 xl:grid-cols-[minmax(24rem,35rem)_1fr]">
          <form className="flex max-w-xl flex-col gap-4" onSubmit={handleUpdate}>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              ITEM DE INVENTARIO {elementId}
            </h1>

            <InputForm
              label="Nombre"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              optional={false}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <InputForm
                label="Marca"
                name="brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                optional={true}
              />
              <InputForm
                label="Modelo"
                name="model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                optional={true}
              />
            </div>

            {supportsStockMinimum || isProtectionElement ? (
              <div className={`grid gap-4 ${isProtectionElement ? "md:grid-cols-2" : ""}`}>
                {supportsStockMinimum ? (
                  <InputForm
                    label="Stock Minimo"
                    name="stockMinimum"
                    type="number"
                    value={stockMinimum}
                    onChange={(e) => setStockMinimum(parseOptionalNumber(e.target.value))}
                    optional={true}
                  />
                ) : null}
              {isProtectionElement ? (
                <InputForm
                  label="Talla"
                  name="size"
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  optional={true}
                />
              ) : null}
              </div>
            ) : null}

            {isProtectionElement ? (
              <SelectForm
                label="Categoria"
                name="family"
                value={family}
                onChange={(value) => setFamily(value as InventoryFamilyKey)}
                options={[
                  { value: "epp", label: "EPP - Elementos de proteccion personal" },
                  { value: "epi", label: "EPI - Elementos de proteccion individual" },
                  { value: "uniform", label: "Uniforme - No retorna a oficina" },
                ]}
              />
            ) : null}

            {isProtectionElement ? (
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-gray-700">Retorno obligatorio</span>
                <div className="flex gap-6 text-sm font-semibold text-gray-700">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={family !== "uniform"} readOnly />
                    Si
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={family === "uniform"} readOnly />
                    No
                  </label>
                </div>
              </div>
            ) : null}

            <TextAreaForm
              label="Descripcion"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              optional={true}
            />

            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <p className="font-semibold">{selectedFamilyLabel}</p>
              {isOfficeMaterial ? (
                <p>
                  Retorno opcional, unidad fija: unidad. Puede pedirse por requerimiento,
                  cargarse a obra y retornar sin bloquear la finalizacion del proyecto.
                </p>
              ) : isSsomaSupply ? (
                <p>
                  Control por cantidad, unidad fija: unidad. Puede cargarse a obra y
                  descontarse mediante ingresos, salidas y ajustes de inventario.
                </p>
              ) : (
                <p>
                  Codigo {codeRequirementLabel.toLowerCase()}, registros historicos conservados y
                  movimientos visibles desde esta ficha.
                </p>
              )}
            </div>

            <ButtonContainer>
              <ReturnButton onClick={() => navigateToInventory(family)} />
              <DeleteButton
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={deleting}
              />
              <SaveButton loading={updating} />
            </ButtonContainer>
          </form>

          <section className="flex flex-col gap-6 max-w-xl xl:max-w-full">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Trazabilidad de inventario</h2>
              <p className="mt-2 text-sm text-gray-500">
                Aqui puedes ver donde esta actualmente el item y el historial de sus movimientos.
              </p>
            </div>

            {loadingInventory ? (
              <LoadingSkeletonForm numberRows={2} />
            ) : inventoryError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                {inventoryError}
              </div>
            ) : inventoryDetail ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <TraceabilityCard
                    label="Total"
                    value={totalInventoryStock}
                    tone="default"
                  />
                  <TraceabilityCard
                    label="Total en Oficina"
                    value={totalOfficeStock}
                    tone="success"
                  />
                  <TraceabilityCard
                    label="Total en proyectos"
                    value={totalProjectStock}
                    tone="warning"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementModal("entry")}
                    className="rounded-md bg-[#0047a3] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#003366]"
                  >
                    Registrar ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementModal("disposal")}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
                  >
                    Registrar salida
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementModal("adjustment")}
                    className="rounded-md bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-600"
                  >
                    Registrar ajuste
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-bold text-gray-900">Ubicaciones actuales</h3>
                  {!currentLocationRows.length ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-gray-500">
                      No hay unidades activas de este item en oficina ni en obra.
                    </div>
                  ) : (
                    <Table<CurrentInventoryLocationRow>
                      data={currentLocationRows}
                      columns={currentLocationColumns}
                      enablePagination={currentLocationRows.length > 10}
                    />
                  )}
                </div>
              </>
            ) : null}
          </section>

          <section className="xl:col-span-2 max-w-xl xl:max-w-full">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Historial de movimientos</h3>
            {loadingInventory ? (
              <LoadingSkeletonForm numberRows={1} />
            ) : !inventoryDetail?.movementHistory.length ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-gray-500">
                Todavia no hay movimientos registrados para este item.
              </div>
            ) : (
              <Table<InventoryMovement>
                data={inventoryDetail.movementHistory}
                columns={movementColumns}
                enablePagination={inventoryDetail.movementHistory.length > 10}
              />
            )}
          </section>
        </div>

        {movementModal && canRegisterStockMovements ? (
          <InventoryMovementModal
            mode={movementModal}
            elementName={element?.name || "Elemento"}
            officeEntries={availableOfficeEntries}
            loading={registeringMovement}
            onClose={() => setMovementModal(null)}
            onSubmit={handleMovementSubmit}
          />
        ) : null}
        {selectedMovement ? (
          <MovementDetailModal
            movement={selectedMovement}
            onClose={() => setSelectedMovement(null)}
          />
        ) : null}
        {deleteDialog}
      </>
    );
  }

  if (isSafetyEquipment) {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        <div className="grid gap-10 p-10 xl:grid-cols-[minmax(24rem,35rem)_1fr]">
          <form className="flex max-w-xl flex-col gap-4" onSubmit={handleUpdate}>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              ITEM DE INVENTARIO {elementId}
            </h1>

            <div className="flex w-full flex-col gap-2">
              <label htmlFor="safetyType" className="font-semibold text-nowrap">
                Tipo de Equipo
              </label>
              <select
                id="safetyType"
                name="safetyType"
                className="w-full rounded-sm border border-gray-400 p-2 focus:outline-[#0047a3]"
                value={safetyTypeSelection}
                onChange={(event) => {
                  const value = event.target.value;
                  setSafetyTypeSelection(value);
                  setName(value === NEW_SAFETY_TYPE_VALUE ? "" : value);
                }}
                required
              >
                <option value="">Seleccionar...</option>
                {existingSafetyTypes.map((typeName) => (
                  <option key={typeName} value={typeName}>{typeName}</option>
                ))}
                <option value={NEW_SAFETY_TYPE_VALUE}>Registrar nuevo tipo</option>
              </select>
              {safetyTypeSelection === NEW_SAFETY_TYPE_VALUE ? (
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="w-full rounded-sm border border-gray-400 p-2 focus:outline-[#0047a3]"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ej: Extintor"
                  required
                />
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputForm
                label="Marca"
                name="brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                optional={true}
              />
              <InputForm
                label="Modelo"
                name="model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                optional={true}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputForm
                label="Serie"
                name="serialNumber"
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                optional={true}
              />
              <StatusRadio
                value={operationalStatus}
                onChange={setOperationalStatus}
                label="Estado de Operat."
              />
            </div>

            <div className="flex items-end gap-3">
              <InputForm
                label="Link de ficha tecnica"
                name="technicalSheetLink"
                type="text"
                value={technicalSheetLink}
                onChange={(e) => setTechnicalSheetLink(e.target.value)}
                optional={true}
              />
              <TechnicalSheetButton url={technicalSheetLink} />
            </div>

            <TextAreaForm
              label="Descripcion"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              optional={true}
            />

            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <p className="font-semibold">{selectedFamilyLabel}</p>
              <p>
                Familia fija para equipos de seguridad y emergencia. El tipo registrado
                se reutiliza en los requerimientos.
              </p>
            </div>

            <ButtonContainer>
              <ReturnButton onClick={() => navigateToInventory(family)} />
              <DeleteButton
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={deleting}
              />
              <SaveButton loading={updating} />
            </ButtonContainer>
          </form>

          <section className="flex max-w-xl flex-col gap-6 xl:max-w-full">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Trazabilidad de inventario</h2>
              <p className="mt-2 text-sm text-gray-500">
                Aqui puedes ver donde esta actualmente el item y el historial de sus movimientos.
              </p>
            </div>

            {loadingInventory ? (
              <LoadingSkeletonForm numberRows={2} />
            ) : inventoryError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                {inventoryError}
              </div>
            ) : inventoryDetail ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <TraceabilityCard
                    label="Total"
                    value={totalInventoryStock}
                    tone="default"
                  />
                  <TraceabilityCard
                    label="Total en Oficina"
                    value={totalOfficeStock}
                    tone="success"
                  />
                  <TraceabilityCard
                    label="Total en proyectos"
                    value={totalProjectStock}
                    tone="warning"
                  />
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  Este equipo es un item fisico unico. Su movimiento se registra al enviarlo por
                  requerimiento y al retornarlo desde la obra.
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-bold text-gray-900">Ubicaciones actuales</h3>
                  {!currentLocationRows.length ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-gray-500">
                      No hay unidades activas de este item en oficina ni en obra.
                    </div>
                  ) : (
                    <Table<CurrentInventoryLocationRow>
                      data={currentLocationRows}
                      columns={currentLocationColumns}
                      enablePagination={currentLocationRows.length > 10}
                    />
                  )}
                </div>
              </>
            ) : null}
          </section>

          <section className="max-w-xl xl:col-span-2 xl:max-w-full">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Historial de movimientos</h3>
            {loadingInventory ? (
              <LoadingSkeletonForm numberRows={1} />
            ) : !inventoryDetail?.movementHistory.length ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-gray-500">
                Todavia no hay movimientos registrados para este item.
              </div>
            ) : (
              <Table<InventoryMovement>
                data={inventoryDetail.movementHistory}
                columns={movementColumns}
                enablePagination={inventoryDetail.movementHistory.length > 10}
              />
            )}
          </section>
        </div>

        {movementModal && canRegisterStockMovements ? (
          <InventoryMovementModal
            mode={movementModal}
            elementName={element?.name || "Elemento"}
            officeEntries={availableOfficeEntries}
            loading={registeringMovement}
            onClose={() => setMovementModal(null)}
            onSubmit={handleMovementSubmit}
          />
        ) : null}
        {selectedMovement ? (
          <MovementDetailModal
            movement={selectedMovement}
            onClose={() => setSelectedMovement(null)}
          />
        ) : null}
        {deleteDialog}
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex flex-col gap-8">
        <Form name={`ITEM DE INVENTARIO ${elementId}`} handleSubmit={handleUpdate}>
          {isLegacyOperative ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Este item pertenece al grupo <span className="font-semibold">Operative legado</span>.
              Selecciona su familia correcta y guarda para migrarlo sin perder historial.
            </div>
          ) : null}

          {isProtectionElement ? (
            <div className="flex flex-col gap-2">
              <InputForm
                label="Nombre"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                optional={false}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <InputForm label="Marca" name="brand" type="text" value={brand} onChange={(e) => setBrand(e.target.value)} optional={true} />
                <InputForm label="Modelo" name="model" type="text" value={model} onChange={(e) => setModel(e.target.value)} optional={true} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <InputForm label="Stock Minimo" name="stockMinimum" type="number" value={stockMinimum} onChange={(e) => setStockMinimum(parseOptionalNumber(e.target.value))} optional={true} />
                <InputForm label="Talla" name="size" type="text" value={size} onChange={(e) => setSize(e.target.value)} optional={true} />
              </div>
              <SelectForm
                label="Categoria"
                name="family"
                value={family}
                onChange={(value) => setFamily(value as InventoryFamilyKey)}
                options={[
                  { value: "epp", label: "EPP" },
                  { value: "epi", label: "EPI" },
                  { value: "uniform", label: "Uniforme" },
                ]}
              />
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-gray-700">Retorno obligatorio</span>
                <div className="flex gap-6 text-sm font-semibold text-gray-700">
                  <label className="flex items-center gap-2"><input type="radio" checked={family !== "uniform"} readOnly />Si</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={family === "uniform"} readOnly />No</label>
                </div>
              </div>
            </div>
          ) : isSafetyEquipment ? (
            <div className="flex flex-col gap-2">
              <div className="flex w-full flex-col gap-2">
                <label htmlFor="safetyType" className="font-semibold text-nowrap">Tipo de Equipo</label>
                <select
                  id="safetyType"
                  name="safetyType"
                  className="w-full rounded-sm border border-gray-400 p-2 focus:outline-[#0047a3]"
                  value={safetyTypeSelection}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSafetyTypeSelection(value);
                    setName(value === NEW_SAFETY_TYPE_VALUE ? "" : value);
                  }}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {existingSafetyTypes.map((typeName) => (
                    <option key={typeName} value={typeName}>{typeName}</option>
                  ))}
                  <option value={NEW_SAFETY_TYPE_VALUE}>Registrar nuevo tipo</option>
                </select>
                {safetyTypeSelection === NEW_SAFETY_TYPE_VALUE ? (
                  <input id="name" name="name" type="text" className="w-full rounded-sm border border-gray-400 p-2 focus:outline-[#0047a3]" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Extintor" required />
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <InputForm label="Marca" name="brand" type="text" value={brand} onChange={(e) => setBrand(e.target.value)} optional={true} />
                <InputForm label="Modelo" name="model" type="text" value={model} onChange={(e) => setModel(e.target.value)} optional={true} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <InputForm label="Serie" name="serialNumber" type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} optional={true} />
                <StatusRadio value={operationalStatus} onChange={setOperationalStatus} label="Estado de Operat." />
              </div>
              <InputForm label="Link de ficha tecnica" name="technicalSheetLink" type="text" value={technicalSheetLink} onChange={(e) => setTechnicalSheetLink(e.target.value)} optional={true} />
            </div>
          ) : isFallProtection ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <InputForm label="Codigo del Elemento" name="code" type="text" value={code} onChange={(e) => setCode(e.target.value)} optional={false} />
                <SelectForm
                  label="Categoria"
                  name="categoryName"
                  value={categoryName}
                  onChange={(value) => setCategoryName(value)}
                  options={[
                    { value: "Arnes", label: "Arnes" },
                    { value: "Banda de Anclaje", label: "Banda de Anclaje" },
                    { value: "Linea de Vida", label: "Linea de Vida" },
                    { value: "Eslinga de posicionamiento", label: "Eslinga de posicionamiento" },
                  ]}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <InputForm label="Serie" name="serialNumber" type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} optional={true} />
                <InputForm label="Marca" name="brand" type="text" value={brand} onChange={(e) => setBrand(e.target.value)} optional={true} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <StatusRadio value={operationalStatus} onChange={setOperationalStatus} label="Estado de Operatividad" />
                <InputForm label="Link de ficha tecnica" name="technicalSheetLink" type="text" value={technicalSheetLink} onChange={(e) => setTechnicalSheetLink(e.target.value)} optional={true} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <InputForm label="Fecha de fabricacion" name="manufactureDate" type="date" value={manufactureDate} onChange={(e) => setManufactureDate(e.target.value)} optional={true} />
                <InputForm label="Fecha de vencimiento" name="expirationDate" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} optional={true} />
              </div>
            </>
          ) : null}

          <TextAreaForm
            label="Descripcion"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            optional={true}
          />

          <SelectForm
            label="Familia"
            name="family"
            value={family}
            onChange={(value) => setFamily(value as InventoryFamilyKey)}
            options={[
              { value: "epp", label: "EPP - Elementos de proteccion personal" },
              { value: "epi", label: "EPI - Elementos de proteccion individual" },
              { value: "uniform", label: "Uniforme - No retorna a oficina" },
              { value: "officeMaterial", label: "Materiales de Oficina - Retorno opcional" },
              { value: "ese", label: "ESE - Equipos de seguridad y/o emergencia" },
              { value: "harness", label: "EPA - Proteccion anticaida" },
              { value: "quality", label: "Calidad - Activo unico" },
            ]}
          />

          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <p className="font-semibold">
              {selectedFamilyLabel}
            </p>
            <p>
              Codigo {codeRequirementLabel.toLowerCase()}, registros historicos conservados y
              movimientos visibles desde esta ficha.
            </p>
            {familyConfig?.unique ? (
              <p className="mt-1">
                Esta familia se maneja como activo unico. Las unidades fisicas usaran este item como base maestra.
              </p>
            ) : null}
          </div>

          <ButtonContainer>
            <ReturnButton
              onClick={() => navigateToInventory(isLegacyOperative ? "operative" : family)}
            />
            <DeleteButton
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={deleting}
            />
            <SaveButton loading={updating} />
          </ButtonContainer>
        </Form>

        <section className="flex flex-col gap-6 p-10">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-500">Modelo de catalogo</p>
              <p className="text-xl font-extrabold text-gray-800">
                {familyConfig?.unique ? "Activo unico" : "Stock base"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-500">Activos registrados</p>
              <p className="text-3xl font-extrabold text-gray-800">
                {assetSummary?.totalAssets || 0}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-500">Activos disponibles</p>
              <p className="text-3xl font-extrabold text-[#166534]">
                {assetSummary?.availableAssets || 0}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-gray-900">Trazabilidad de inventario</h2>
              <p className="text-sm text-gray-500">
                Aqui puedes ver donde esta actualmente el item y el historial de sus movimientos.
              </p>
            </div>
            {canRegisterStockMovements ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMovementModal("entry")}
                  className="rounded-md bg-[#0047a3] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#003366]"
                >
                  Registrar ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setMovementModal("disposal")}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
                >
                  Registrar salida
                </button>
                <button
                  type="button"
                  onClick={() => setMovementModal("adjustment")}
                  className="rounded-md bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-600"
                >
                  Registrar ajuste
                </button>
              </div>
            ) : null}
          </div>

          {familyConfig?.unique ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Esta ficha ya esta preparada para activos unicos. En la siguiente fase se registraran
              las unidades fisicas y su trazabilidad por codigo, serie, partes o calibracion.
            </div>
          ) : null}

          {loadingInventory ? (
            <LoadingSkeletonForm numberRows={2} />
          ) : inventoryError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {inventoryError}
            </div>
          ) : inventoryDetail ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500">Total recibido</p>
                  <p className="text-3xl font-extrabold text-gray-800">
                    {formatInventoryQuantity(inventoryDetail.summary.totalReceived)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500">Total retornado</p>
                  <p className="text-3xl font-extrabold text-[#166534]">
                    {formatInventoryQuantity(inventoryDetail.summary.totalReturned)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500">Ubicacion actual</p>
                  <p className="text-3xl font-extrabold text-[#b45309]">
                    {formatInventoryQuantity(inventoryDetail.summary.totalPending)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-gray-900">Ubicaciones actuales</h3>
                {!currentLocationRows.length ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-gray-500">
                    No hay unidades activas de este item en oficina ni en obra.
                  </div>
                ) : (
                  <Table<CurrentInventoryLocationRow>
                    data={currentLocationRows}
                    columns={currentLocationColumns}
                    enablePagination={currentLocationRows.length > 10}
                  />
                )}
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-gray-900">Historial de movimientos</h3>
                {!inventoryDetail.movementHistory.length ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-gray-500">
                    Todavia no hay movimientos registrados para este item.
                  </div>
                ) : (
                  <Table<InventoryMovement>
                    data={inventoryDetail.movementHistory}
                    columns={movementColumns}
                    enablePagination={inventoryDetail.movementHistory.length > 10}
                  />
                )}
              </div>
            </>
          ) : null}
        </section>
      </div>
      {movementModal && canRegisterStockMovements ? (
        <InventoryMovementModal
          mode={movementModal}
          elementName={element?.name || "Elemento"}
          officeEntries={availableOfficeEntries}
          loading={registeringMovement}
          onClose={() => setMovementModal(null)}
          onSubmit={handleMovementSubmit}
        />
      ) : null}
      {selectedMovement ? (
        <MovementDetailModal
          movement={selectedMovement}
          onClose={() => setSelectedMovement(null)}
        />
      ) : null}
      {deleteDialog}
    </>
  );
}

function TraceabilityCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "success" | "warning";
}) {
  const valueColorByTone: Record<typeof tone, string> = {
    default: "text-gray-900",
    success: "text-green-700",
    warning: "text-orange-700",
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${valueColorByTone[tone]}`}>
        {formatInventoryQuantity(value)}
      </p>
    </div>
  );
}

function TechnicalSheetButton({ url }: { url?: string | null }) {
  const normalizedUrl = normalizeTechnicalSheetUrl(url);
  const disabled = !normalizedUrl;

  return (
    <button
      type="button"
      aria-label="Abrir ficha tecnica"
      title="Abrir ficha tecnica"
      disabled={disabled}
      onClick={() => {
        if (!normalizedUrl) return;
        window.open(normalizedUrl, "_blank", "noopener,noreferrer");
      }}
      className="mb-[1px] inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-[#0047a3] text-white transition-colors hover:bg-[#003366] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
    >
      <FaFileLines className="size-4" />
    </button>
  );
}

function normalizeTechnicalSheetUrl(url?: string | null) {
  const trimmedUrl = url?.trim();
  if (!trimmedUrl) return "";

  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
}

function buildCurrentLocationRows(
  inventoryDetail: ElementInventoryDetail,
  totalOfficeStock: number,
): CurrentInventoryLocationRow[] {
  const officeUnit = inventoryDetail.officeEntries.find((entry) => entry.currentStock > 0)
    ?.unit ?? "unidad";
  const officeRow: CurrentInventoryLocationRow[] = totalOfficeStock > 0
    ? [
        {
          id: "office",
          locationType: "office",
          locationName: "Oficina",
          responsibleName: "Inventario de oficina",
          unit: officeUnit,
          quantity: totalOfficeStock,
        },
      ]
    : [];

  const projectRows = inventoryDetail.currentLocations
    .filter((entry) => entry.quantityPending > 0)
    .map<CurrentInventoryLocationRow>((entry) => ({
      id: `project-${entry.projectInventoryEntryId}`,
      locationType: "project",
      projectId: entry.projectId,
      locationName: entry.projectName || `Proyecto ${entry.projectId}`,
      responsibleName: entry.responsibleUserName,
      unit: entry.unit,
      quantity: entry.quantityPending,
    }));

  return [...officeRow, ...projectRows];
}

function formatMovementDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value || "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year}, ${hours}:${minutes}`;
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return 0;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function translateMovementType(value: string) {
  const labels: Record<string, string> = {
    office_entry: "Ingreso a oficina",
    request_received: "Ingreso a obra",
    returned_to_office: "Retorno a oficina",
    transfer_between_projects: "Transferencia entre proyectos",
    assigned_to_worker: "Asignacion a trabajador",
    returned_from_worker: "Retorno de trabajador",
    disposal: "Salida",
    adjustment: "Ajuste",
    maintenance_out: "Salida a mantenimiento",
    maintenance_return: "Retorno de mantenimiento",
  };

  return labels[value] || value.split("_").join(" ");
}

function translateInventoryLocation(value: string) {
  const labels: Record<string, string> = {
    office: "Oficina",
    project: "Proyecto",
    worker: "Trabajador",
    external: "Externo",
  };

  return labels[value] || value;
}

function MovementTypeBadge({
  movementType,
  onClick,
}: {
  movementType: string;
  onClick?: () => void;
}) {
  const toneByMovement: Record<string, string> = {
    office_entry: "bg-emerald-600 hover:bg-emerald-700",
    request_received: "bg-blue-600 hover:bg-blue-700",
    returned_to_office: "bg-blue-600 hover:bg-blue-700",
    returned_from_worker: "bg-blue-600 hover:bg-blue-700",
    transfer_between_projects: "bg-indigo-600 hover:bg-indigo-700",
    assigned_to_worker: "bg-indigo-600 hover:bg-indigo-700",
    disposal: "bg-red-600 hover:bg-red-700",
    adjustment: "bg-amber-500 hover:bg-amber-600",
    maintenance_out: "bg-red-600 hover:bg-red-700",
    maintenance_return: "bg-emerald-600 hover:bg-emerald-700",
  };
  const colorClass = toneByMovement[movementType] || "bg-gray-700 hover:bg-gray-800";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-4 py-2 text-sm font-extrabold text-white shadow-sm transition-colors ${colorClass}`}
    >
      {translateMovementType(movementType)}
    </button>
  );
}

function MovementDetailModal({
  movement,
  onClose,
}: {
  movement: InventoryMovement;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900">
              Detalle del movimiento
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Movimiento #{movement.inventoryMovementId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1 text-2xl font-bold text-gray-400 hover:text-gray-700"
          >
            x
          </button>
        </div>

        <div className="mb-5">
          <MovementTypeBadge movementType={movement.movementType} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <MovementDetailRow label="Fecha" value={formatMovementDate(movement.createdAt)} />
          <MovementDetailRow
            label="Cantidad"
            value={formatInventoryQuantity(movement.quantity)}
          />
          <MovementDetailRow
            label="Desde"
            value={translateInventoryLocation(movement.fromLocation)}
          />
          <MovementDetailRow
            label="Hacia"
            value={translateInventoryLocation(movement.toLocation)}
          />
          <MovementDetailRow label="Proyecto" value={movement.projectName || "-"} />
          <MovementDetailRow
            label="Responsable"
            value={movement.responsibleUserName || "-"}
          />
          <MovementDetailRow
            label="Registrado por"
            value={movement.performedByUserName || "-"}
          />
          <MovementDetailRow label="Solicitud" value={movement.requestId || "-"} />
        </div>

        <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-bold text-gray-600">Observacion</p>
          <p className="mt-2 whitespace-pre-wrap text-gray-900">
            {movement.notes || "Sin observacion."}
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#0047a3] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#003366]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function MovementDetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <p className="text-sm font-bold text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function InventoryMovementModal({
  mode,
  elementName,
  officeEntries,
  loading,
  onClose,
  onSubmit,
}: {
  mode: MovementModalMode;
  elementName: string;
  officeEntries: OfficeInventoryEntry[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    officeInventoryEntryId?: number;
    quantity?: number;
    newQuantity?: number;
    reason?: string;
    notes?: string;
  }) => void;
}) {
  const [officeInventoryEntryId, setOfficeInventoryEntryId] = useState(
    officeEntries[0]?.officeInventoryEntryId ? String(officeEntries[0].officeInventoryEntryId) : "",
  );
  const [quantity, setQuantity] = useState(1);
  const [newQuantity, setNewQuantity] = useState(0);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const titleByMode: Record<MovementModalMode, string> = {
    entry: "Registrar ingreso",
    disposal: "Registrar salida",
    adjustment: "Registrar ajuste",
  };

  const selectedEntry = officeEntries.find(
    (entry) => entry.officeInventoryEntryId === Number(officeInventoryEntryId),
  );
  const requiresOfficeEntry = mode !== "entry";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (requiresOfficeEntry && !officeInventoryEntryId) {
      toast.error("Selecciona un registro de inventario de oficina.");
      return;
    }

    if (mode === "entry" && quantity <= 0) {
      toast.error("La cantidad de ingreso debe ser mayor a cero.");
      return;
    }

    if (mode === "disposal" && quantity <= 0) {
      toast.error("La cantidad de salida debe ser mayor a cero.");
      return;
    }

    if (mode !== "entry" && reason.trim().length < 3) {
      toast.error("Indica un motivo de al menos 3 caracteres.");
      return;
    }

    onSubmit({
      officeInventoryEntryId: officeInventoryEntryId
        ? Number(officeInventoryEntryId)
        : undefined,
      quantity,
      newQuantity,
      reason: reason.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900">
              {titleByMode[mode]}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{elementName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1 text-2xl font-bold text-gray-400 hover:text-gray-700"
          >
            x
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {requiresOfficeEntry ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">
                Registro de oficina
              </label>
              <select
                value={officeInventoryEntryId}
                onChange={(event) => setOfficeInventoryEntryId(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
                required
              >
                <option value="">Seleccionar...</option>
                {officeEntries.map((entry) => (
                  <option key={entry.officeInventoryEntryId} value={entry.officeInventoryEntryId}>
                    #{entry.officeInventoryEntryId} - Stock {formatInventoryQuantity(entry.currentStock)} {entry.unit}
                  </option>
                ))}
              </select>
              {!officeEntries.length ? (
                <p className="text-sm text-red-600">
                  No hay registros de oficina disponibles para este elemento.
                </p>
              ) : selectedEntry ? (
                <p className="text-xs font-semibold text-gray-500">
                  Stock actual: {formatInventoryQuantity(selectedEntry.currentStock)} {selectedEntry.unit}
                </p>
              ) : null}
            </div>
          ) : null}

          {mode === "adjustment" ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Nueva cantidad</label>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={newQuantity}
                onChange={(event) => setNewQuantity(Number(event.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
                required
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Cantidad</label>
              <input
                type="number"
                min="0.0001"
                step="0.0001"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
                required
              />
            </div>
          )}

          {mode !== "entry" ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Motivo</label>
              <input
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
                required
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">Descripcion</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-24 rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || (requiresOfficeEntry && !officeEntries.length)}
            className="rounded-md bg-[#0047a3] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#003366] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatusRadio({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <div className="flex gap-6 text-sm font-semibold text-gray-700">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="operationalStatus"
            checked={value === "operativo"}
            onChange={() => onChange("operativo")}
          />
          Operativo
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="operationalStatus"
            checked={value === "inoperativo"}
            onChange={() => onChange("inoperativo")}
          />
          Inoperativo
        </label>
      </div>
    </div>
  );
}
