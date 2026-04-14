import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  ElementInventoryDetail,
  ElementType,
  InventoryMovement,
  ProjectInventoryEntry,
  UpdateElementDto,
} from "../../data/types";
import LoadingSkeletonForm from "../../common/loading/LoadingSkeletonForm";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction } from "../../hooks/useApiAction";
import { elementApi, inventoryApi } from "../../data/apiUrl";
import {
  ButtonContainer,
  Form,
  InputForm,
  SelectForm,
  TextAreaForm,
} from "../../common/form";
import { ReturnButton, SaveButton, SeeButton } from "../../common/button";
import { Table } from "../../common/table";
import toast, { Toaster } from "react-hot-toast";
import type { InventoryFamilyKey } from "./inventoryCatalog";
import {
  formatInventoryQuantity,
  getInventoryBackendPayload,
  getInventoryCodeRequirementLabel,
  getInventoryFamilyConfig,
  getInventoryFamilyFromSource,
  getInventoryFamilyLabel,
  isLegacyOperativeSource,
} from "./inventoryCatalog";

export default function Element() {
  const elementId = Number(useParams<{ id: string }>().id ?? 0);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [family, setFamily] = useState<InventoryFamilyKey>("epp");
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");

  const {
    data: element,
    loading,
    error: fetchError,
  } = useFetch<ElementType>(`${elementApi}${elementId}`, [elementId]);
  const {
    data: inventoryDetail,
    loading: loadingInventory,
    error: inventoryError,
  } = useFetch<ElementInventoryDetail>(`${inventoryApi}element/${elementId}`, [elementId]);

  const { execute: updateElement, loading: updating } = useApiAction<ElementType>();

  useEffect(() => {
    if (!element) return;

    setName(element.name);
    setCode(element.code || "");
    setFamily(getInventoryFamilyFromSource(element));
    setCategoryName(element.categoryName || "");
    setDescription(element.description);
  }, [element]);

  const familyConfig = useMemo(() => getInventoryFamilyConfig(family), [family]);
  const isLegacyOperative = isLegacyOperativeSource(element);

  const navigateToInventory = (targetFamily: InventoryFamilyKey = family) => {
    navigate(`/admin/inventory/${targetFamily}`);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const codeRequired = familyConfig?.requiresCode ?? false;

    if (codeRequired && !code.trim()) {
      toast.error("El codigo es obligatorio para ESE y EM.");
      return;
    }

    const backendPayload = getInventoryBackendPayload(family);
    const updatedData: UpdateElementDto = {
      name,
      description,
      code: code.trim() || null,
      family: backendPayload.family,
      categoryName: categoryName.trim() || null,
      type: backendPayload.type,
      controlType: backendPayload.controlType,
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

  const currentLocationColumns = useMemo(
    () =>
      [
        { key: "projectName", label: "Proyecto", width: "16rem" },
        {
          key: "responsibleUserName",
          label: "Responsable",
          width: "14rem",
          render: (row: ProjectInventoryEntry) =>
            row.responsibleUserName || "Sin responsable",
        },
        { key: "unit", label: "Unidad", width: "7rem" },
        { key: "quantityPending", label: "Actual", width: "6rem", align: "center" },
        {
          label: "Ver",
          width: "6rem",
          render: (row: ProjectInventoryEntry) => (
            <SeeButton onClick={() => navigate(`/admin/projects/${row.projectId}/inventory`)} />
          ),
        },
      ] as const,
    [navigate],
  );

  const movementColumns = [
    { key: "createdAt", label: "Fecha", width: "12rem" },
    {
      key: "movementType",
      label: "Movimiento",
      width: "12rem",
      render: (row: InventoryMovement) => row.movementType.split("_").join(" "),
    },
    { key: "fromLocation", label: "Desde", width: "12rem" },
    { key: "toLocation", label: "Hacia", width: "12rem" },
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
      key: "notes",
      label: "Observacion",
      width: "20rem",
      truncate: true,
      render: (row: InventoryMovement) => row.notes || "-",
    },
  ] as const;

  if (loading) return <LoadingSkeletonForm numberRows={3} />;
  if (fetchError) return <div className="text-red-500">{fetchError}</div>;

  const selectedFamilyLabel = getInventoryFamilyLabel(family);
  const codeRequirementLabel = getInventoryCodeRequirementLabel(family);

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

          <InputForm
            label="Nombre"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            optional={false}
          />

          <InputForm
            label="Codigo"
            name="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            optional={!familyConfig?.requiresCode}
          />

          <InputForm
            label="Categoria"
            name="categoryName"
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            optional={true}
          />

          <TextAreaForm
            label="Descripcion"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            optional={false}
          />

          <SelectForm
            label="Familia"
            name="family"
            value={family}
            onChange={(value) => setFamily(value as InventoryFamilyKey)}
            options={[
              { value: "epp", label: "EPP - Elementos de proteccion personal" },
              { value: "epi", label: "EPI - Elementos de proteccion individual" },
              { value: "ese", label: "ESE - Equipos de seguridad y/o emergencia" },
              { value: "em", label: "EM - Equipos de medicion" },
              { value: "consumibles", label: "Consumibles SSOMA" },
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
          </div>

          <ButtonContainer>
            <ReturnButton
              onClick={() => navigateToInventory(isLegacyOperative ? "operative" : family)}
            />
            <SaveButton loading={updating} />
          </ButtonContainer>
        </Form>

        <section className="flex flex-col gap-6 p-10">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-gray-900">Trazabilidad de inventario</h2>
            <p className="text-sm text-gray-500">
              Aqui puedes ver donde esta actualmente el item y el historial de sus movimientos.
            </p>
          </div>

          {family === "ese" || family === "em" ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Esta familia requiere codigo obligatorio para poder mantener su trazabilidad.
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
                {!inventoryDetail.currentLocations.length ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-gray-500">
                    No hay unidades activas de este item en obra.
                  </div>
                ) : (
                  <Table<ProjectInventoryEntry>
                    data={inventoryDetail.currentLocations}
                    columns={currentLocationColumns}
                    enablePagination={inventoryDetail.currentLocations.length > 10}
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
    </>
  );
}
