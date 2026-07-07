import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { elementApi, inventoryApi } from "../../data/apiUrl";
import { useApiAction, useCurrentUser, useFetch } from "../../hooks";
import { ReturnButton, SaveButton } from "../../common/button";
import {
  ButtonContainer,
  Form,
  InputForm,
  SelectForm,
  TextAreaForm,
} from "../../common/form";
import toast, { Toaster } from "react-hot-toast";
import type { InventoryFamilyKey } from "./inventoryCatalog";
import {
  getInventoryBackendPayload,
  getInventoryCodeRequirementLabel,
  getInventoryFamilyConfig,
  getInventoryFamilyLabel,
  resolveInventoryRouteFamily,
  usesInventoryStockFields,
} from "./inventoryCatalog";

interface ElementResponse {
  name: string;
  type: string;
  description: string;
  code?: string | null;
  family?: string | null;
  categoryName?: string | null;
  stockMinimum?: number;
  controlType?: string;
  elementId?: number;
}

const NEW_SAFETY_TYPE_VALUE = "__new_safety_type__";

export default function NewEpp() {
  const searchParams = new URLSearchParams(window.location.search);
  const familyRoot = resolveInventoryRouteFamily(searchParams.get("family") || searchParams.get("type"));
  const isFallProtectionGroupMode = searchParams.get("mode") === "group";
  const initialFamily: InventoryFamilyKey = familyRoot === "all" || familyRoot === "operative"
    ? "epp"
    : familyRoot;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
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
  const [initialQuantity, setInitialQuantity] = useState(0);
  const unit = "unidad";
  const [description, setDescription] = useState("");
  const [family, setFamily] = useState<InventoryFamilyKey>(initialFamily);
  const [safetyTypeSelection, setSafetyTypeSelection] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [groupHarnessElementIds, setGroupHarnessElementIds] = useState<string[]>([""]);
  const [groupAnchorBandElementIds, setGroupAnchorBandElementIds] = useState<string[]>([""]);
  const [groupLifelineElementIds, setGroupLifelineElementIds] = useState<string[]>([""]);
  const [groupPositioningLanyardElementIds, setGroupPositioningLanyardElementIds] = useState<string[]>([""]);

  const navigate = useNavigate();
  const { execute, loading } = useApiAction<ElementResponse>();
  const { execute: registerOfficeEntry } = useApiAction<unknown>();
  const { user } = useCurrentUser();
  const { data: existingElements } = useFetch<ElementResponse[]>(elementApi, []);

  const familyConfig = getInventoryFamilyConfig(family);
  const usesStockFields = usesInventoryStockFields(family);
  const isSafetyEquipment = family === "ese";
  const isProtectionElement = family === "epp" || family === "epi" || family === "uniform";
  const isOfficeMaterial = family === "officeMaterial";
  const isSsomaSupply = family === "ssomaSupply";
  const isStockCatalogElement = isProtectionElement || isOfficeMaterial || isSsomaSupply;
  const isFallProtection = family === "harness";
  const supportsStockMinimum = usesStockFields && !isSsomaSupply;
  const existingSafetyTypes = useMemo(
    () =>
      Array.from(
        new Set(
          (existingElements || [])
            .filter((element) => element.family === "ese")
            .map((element) => element.categoryName || element.name)
            .filter((value): value is string => Boolean(value?.trim())),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [existingElements],
  );
  const fallProtectionElementsByCategory = useMemo(() => {
    const normalize = (value?: string | null) =>
      value
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase() ?? "";

    const elements = (existingElements || []).filter((element) => element.family === "harness");
    const categoryOf = (element: ElementResponse) => normalize(element.categoryName || element.name);

    return {
      harness: elements.filter((element) => categoryOf(element).includes("arnes")),
      anchorBand: elements.filter((element) => categoryOf(element).includes("banda")),
      lifeline: elements.filter((element) => categoryOf(element).includes("linea")),
      positioningLanyard: elements.filter((element) => categoryOf(element).includes("eslinga")),
    };
  }, [existingElements]);

  const navigateToElements = () => {
    navigate(`/admin/inventory/${family}`);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (familyConfig?.requiresCode && !code.trim()) {
      toast.error(`El codigo es obligatorio para ${getInventoryFamilyLabel(family)}.`);
      return;
    }

    if (isFallProtectionGroupMode) {
      const components = [
        ...toFallProtectionComponents("harness", groupHarnessElementIds),
        ...toFallProtectionComponents("anchorBand", groupAnchorBandElementIds),
        ...toFallProtectionComponents("lifeline", groupLifelineElementIds),
        ...toFallProtectionComponents("positioningLanyard", groupPositioningLanyardElementIds),
      ];
      const hasEachCategory = [
        "harness",
        "anchorBand",
        "lifeline",
        "positioningLanyard",
      ].every((role) => components.some((component) => component.role === role));

      if (!groupCode.trim() || !hasEachCategory) {
        toast.error("El grupo EPA debe tener codigo y al menos un elemento de cada categoria.");
        return;
      }

      const groupData = {
        code: groupCode.trim(),
        components,
        description: description.trim() || undefined,
      };

      toast.promise(execute(`${elementApi}fall-protection-groups`, "POST", groupData), {
        loading: "Creando grupo EPA...",
        success: (result) => {
          setTimeout(() => navigate("/admin/inventory/harness"), 1200);
          return result.message || "Grupo EPA creado con exito";
        },
        error: (err) => err.message || "Error al crear el grupo EPA",
      });
      return;
    }

    const backendPayload = getInventoryBackendPayload(family);
    const selectedSafetyType = safetyTypeSelection === NEW_SAFETY_TYPE_VALUE
      ? name.trim()
      : safetyTypeSelection;
    const normalizedFallProtectionCategory = categoryName.trim();
    const normalizedName = isSafetyEquipment
      ? selectedSafetyType
      : isFallProtection
        ? normalizedFallProtectionCategory || code.trim()
        : name.trim();

    if (isSafetyEquipment && !normalizedName) {
      toast.error("Selecciona un tipo de equipo o registra uno nuevo.");
      return;
    }

    if (isFallProtection && (!code.trim() || !normalizedFallProtectionCategory)) {
      toast.error("Indica el codigo del elemento y la categoria EPA.");
      return;
    }

    const elementData = {
      name: normalizedName,
      type: backendPayload.type,
      family: backendPayload.family,
      description,
      code: isSafetyEquipment ? serialNumber.trim() || null : code.trim() || null,
      categoryName: isSafetyEquipment
        ? normalizedName
        : isProtectionElement || isSsomaSupply
          ? categoryName.trim() || null
          : null,
      stockMinimum: supportsStockMinimum ? stockMinimum : 0,
      controlType: backendPayload.controlType,
      brand: brand.trim() || null,
      model: model.trim() || null,
      size: isProtectionElement ? size.trim() || null : null,
      serialNumber: isSafetyEquipment
        ? serialNumber.trim() || null
        : isFallProtection
          ? serialNumber.trim() || null
          : null,
      technicalSheetLink: technicalSheetLink.trim() || null,
      operationalStatus: isSafetyEquipment || isFallProtection ? operationalStatus : null,
      manufactureDate: manufactureDate || null,
      expirationDate: expirationDate || null,
    };

    const createWithInitialStock = async () => {
      const result = await execute(elementApi, "POST", elementData);
      const shouldCreateOfficeEntry =
        (usesStockFields && initialQuantity > 0) || isSafetyEquipment;

      if (shouldCreateOfficeEntry && result.data?.elementId && user?.userId) {
        await registerOfficeEntry(`${inventoryApi}office/entry`, "POST", {
          elementId: result.data.elementId,
          unit,
          quantity: isSafetyEquipment ? 1 : initialQuantity,
          performedByUserId: user.userId,
          notes: isSafetyEquipment
            ? "Ubicacion inicial registrada desde catalogo."
            : "Stock inicial registrado desde catalogo.",
        });
      }
      return result;
    };

    toast.promise(createWithInitialStock(), {
      loading: "Creando item de inventario...",
      success: (result) => {
        setTimeout(() => navigateToElements(), 1200);
        return result.message || "Item creado con exito";
      },
      error: (err) => err.message || "Error al crear el item",
    });
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Form
        name={isFallProtectionGroupMode ? "REGISTRAR GRUPO EPA" : "REGISTRAR ITEM DE INVENTARIO"}
        handleSubmit={handleSubmit}
      >
        {isFallProtectionGroupMode ? (
          <>
            <InputForm
              label="Codigo del Equipo"
              name="groupCode"
              type="text"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              optional={false}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FallProtectionPartList
                label="Arnes"
                values={groupHarnessElementIds}
                onChange={setGroupHarnessElementIds}
                elements={fallProtectionElementsByCategory.harness}
              />
              <FallProtectionPartList
                label="Banda de Anclaje"
                values={groupAnchorBandElementIds}
                onChange={setGroupAnchorBandElementIds}
                elements={fallProtectionElementsByCategory.anchorBand}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FallProtectionPartList
                label="Linea de vida"
                values={groupLifelineElementIds}
                onChange={setGroupLifelineElementIds}
                elements={fallProtectionElementsByCategory.lifeline}
              />
              <FallProtectionPartList
                label="Eslinga de posicionamiento"
                values={groupPositioningLanyardElementIds}
                onChange={setGroupPositioningLanyardElementIds}
                elements={fallProtectionElementsByCategory.positioningLanyard}
              />
            </div>
          </>
        ) : isStockCatalogElement ? (
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
                label="Cantidad Inicial"
                name="initialQuantity"
                type="number"
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(Number(e.target.value))}
                optional={true}
              />
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700" htmlFor="unit">
                  Unidad de medida
                </label>
                <div
                  id="unit"
                  className="min-h-[2.75rem] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-700"
                >
                  unidad
                </div>
              </div>
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

            {isProtectionElement ? (
              <>
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
                  <span className="font-semibold text-gray-700">
                    Retorno obligatorio
                  </span>
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
              </>
            ) : isSsomaSupply ? (
              <div className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Control por cantidad. No asignable a trabajador y no retornable.
              </div>
            ) : (
              <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                Retorno opcional. Este material puede volver a oficina, pero no bloquea el cierre del proyecto.
              </div>
            )}
          </div>
        ) : isSafetyEquipment ? (
          <div className="flex flex-col gap-2">
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
                <option key={typeName} value={typeName}>
                  {typeName}
                </option>
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
                onChange={(e) => setName(e.target.value)}
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
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  Estado de Operat.
                </span>
                <div className="flex gap-6 text-sm font-semibold text-gray-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="operationalStatus"
                      checked={operationalStatus === "operativo"}
                      onChange={() => setOperationalStatus("operativo")}
                    />
                    Operativo
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="operationalStatus"
                      checked={operationalStatus === "inoperativo"}
                      onChange={() => setOperationalStatus("inoperativo")}
                    />
                    Inoperativo
                  </label>
                </div>
              </div>
            </div>

            <InputForm
              label="Link de ficha tecnica"
              name="technicalSheetLink"
              type="text"
              value={technicalSheetLink}
              onChange={(e) => setTechnicalSheetLink(e.target.value)}
              optional={true}
            />
          </div>
        ) : isFallProtection ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <InputForm
                label="Codigo del Elemento"
                name="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                optional={false}
              />
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
              <InputForm
                label="Serie"
                name="serialNumber"
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                optional={true}
              />
              <InputForm
                label="Marca"
                name="brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                optional={true}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  Estado de Operatividad
                </span>
                <div className="flex gap-6 text-sm font-semibold text-gray-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="operationalStatus"
                      checked={operationalStatus === "operativo"}
                      onChange={() => setOperationalStatus("operativo")}
                    />
                    Operativo
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="operationalStatus"
                      checked={operationalStatus === "inoperativo"}
                      onChange={() => setOperationalStatus("inoperativo")}
                    />
                    Inoperativo
                  </label>
                </div>
              </div>
              <InputForm
                label="Link de ficha tecnica"
                name="technicalSheetLink"
                type="text"
                value={technicalSheetLink}
                onChange={(e) => setTechnicalSheetLink(e.target.value)}
                optional={true}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputForm
                label="Fecha de fabricacion"
                name="manufactureDate"
                type="date"
                value={manufactureDate}
                onChange={(e) => setManufactureDate(e.target.value)}
                optional={true}
              />
              <InputForm
                label="Fecha de vencimiento"
                name="expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                optional={true}
              />
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

        {!isStockCatalogElement && !isSafetyEquipment && !isFallProtection ? (
          <SelectForm
            label="Familia"
            name="family"
            value={family}
            onChange={(value) => setFamily(value as InventoryFamilyKey)}
            options={[
              { value: "ssomaSupply", label: "Insumos SSOMA" },
              { value: "quality", label: "Calidad - Activo unico" },
            ]}
          />
        ) : null}

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="font-semibold">
            {getInventoryFamilyLabel(family)}
          </p>
          <p>
            Codigo {getInventoryCodeRequirementLabel(family).toLowerCase()}.
          </p>
          {isSafetyEquipment ? (
            <p className="mt-1">
              El tipo de equipo se reutiliza en requerimientos. Puedes seleccionar uno existente o registrar un tipo nuevo.
            </p>
          ) : familyConfig?.unique ? (
            <p className="mt-1">
              Esta familia se usa como catalogo base para activos unicos; las unidades fisicas se registraran despues.
            </p>
          ) : null}
        </div>

        <ButtonContainer>
          <ReturnButton onClick={() => navigate("/admin/inventory")} />
          <SaveButton loading={loading} />
        </ButtonContainer>
      </Form>
    </>
  );
}

function FallProtectionPartList({
  label,
  values,
  onChange,
  elements,
}: {
  label: string;
  values: string[];
  onChange: (value: string[]) => void;
  elements: ElementResponse[];
}) {
  const updateValue = (index: number, value: string) => {
    onChange(values.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const addValue = () => {
    onChange([...values, ""]);
  };

  const removeValue = (index: number) => {
    if (values.length === 1) {
      onChange([""]);
      return;
    }

    onChange(values.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <label className="font-semibold text-nowrap">{label}</label>
      {values.map((value, index) => (
        <div key={`${label}-${index}`} className="grid grid-cols-[1fr_auto] gap-2">
          <select
            className="w-full rounded-sm border border-gray-400 p-2 focus:outline-[#0047a3]"
            value={value}
            onChange={(event) => updateValue(index, event.target.value)}
            required={index === 0}
          >
            <option value="">Seleccionar...</option>
            {elements.map((element) => (
              <option key={element.elementId} value={element.elementId}>
                {element.code ? `${element.name} - ${element.code}` : element.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
            onClick={() => removeValue(index)}
          >
            Quitar
          </button>
        </div>
      ))}
      <button
        type="button"
        className="w-fit rounded-md border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
        onClick={addValue}
      >
        + Anadir {label.toLowerCase()}
      </button>
    </div>
  );
}

function toFallProtectionComponents(
  role: "harness" | "anchorBand" | "lifeline" | "positioningLanyard",
  values: string[],
) {
  return [...new Set(values.map((value) => Number(value)).filter(Boolean))].map(
    (elementId) => ({ role, elementId }),
  );
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return 0;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}
