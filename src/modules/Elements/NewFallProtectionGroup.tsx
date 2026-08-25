import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { ReturnButton } from "../../common/button";
import {
  ButtonContainer,
  ButtonSubmit,
  Form,
  TextAreaForm,
} from "../../common/form";
import { elementApi } from "../../data/apiUrl";
import type { ElementType, FallProtectionGroupType } from "../../data/types";
import { useApiAction, useFetch } from "../../hooks";

type FallProtectionRole =
  | "harness"
  | "anchorBand"
  | "lifeline"
  | "positioningLanyard";

type GroupFormErrors = Partial<Record<"code" | FallProtectionRole, string>>;

const missingRoleMessages: Record<FallProtectionRole, string> = {
  harness: "Selecciona al menos un arnés.",
  anchorBand: "Selecciona al menos una banda de anclaje.",
  lifeline: "Selecciona al menos una línea de vida.",
  positioningLanyard: "Selecciona al menos una eslinga de posicionamiento.",
};

const duplicateRoleMessages: Record<FallProtectionRole, string> = {
  harness: "No selecciones el mismo arnés más de una vez.",
  anchorBand: "No selecciones la misma banda de anclaje más de una vez.",
  lifeline: "No selecciones la misma línea de vida más de una vez.",
  positioningLanyard: "No selecciones la misma eslinga de posicionamiento más de una vez.",
};

export default function NewFallProtectionGroup() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [harnessElementIds, setHarnessElementIds] = useState<string[]>([""]);
  const [anchorBandElementIds, setAnchorBandElementIds] = useState<string[]>([""]);
  const [lifelineElementIds, setLifelineElementIds] = useState<string[]>([""]);
  const [positioningLanyardElementIds, setPositioningLanyardElementIds] = useState<string[]>([""]);
  const [errors, setErrors] = useState<GroupFormErrors>({});

  const { data: existingElements } = useFetch<ElementType[]>(elementApi, []);
  const { execute, loading } = useApiAction<FallProtectionGroupType>();

  const elementsByRole = useMemo(() => {
    const normalize = (value?: string | null) =>
      value
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase() ?? "";

    const elements = (existingElements || []).filter(
      (element) => element.family === "harness",
    );
    const categoryOf = (element: ElementType) =>
      normalize(element.categoryName || element.name);

    return {
      harness: elements.filter((element) => categoryOf(element).includes("arnes")),
      anchorBand: elements.filter((element) => categoryOf(element).includes("banda")),
      lifeline: elements.filter((element) => categoryOf(element).includes("linea")),
      positioningLanyard: elements.filter((element) =>
        categoryOf(element).includes("eslinga"),
      ),
    };
  }, [existingElements]);

  const updateRole = (
    role: FallProtectionRole,
    values: string[],
    setter: (values: string[]) => void,
  ) => {
    setter(values);
    setErrors((current) => ({ ...current, [role]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: GroupFormErrors = {};
    const normalizedCode = code.trim();

    if (!normalizedCode) {
      nextErrors.code = "Ingresa el código del Grupo EPA.";
    }

    const selections: Record<FallProtectionRole, string[]> = {
      harness: harnessElementIds,
      anchorBand: anchorBandElementIds,
      lifeline: lifelineElementIds,
      positioningLanyard: positioningLanyardElementIds,
    };
    const components: { role: FallProtectionRole; elementId: number }[] = [];

    (Object.keys(selections) as FallProtectionRole[]).forEach((role) => {
      const elementIds = selections[role]
        .map((value) => Number(value))
        .filter((elementId) => Number.isInteger(elementId) && elementId > 0);

      if (!elementIds.length) {
        nextErrors[role] = missingRoleMessages[role];
        return;
      }

      if (new Set(elementIds).size !== elementIds.length) {
        nextErrors[role] = duplicateRoleMessages[role];
        return;
      }

      elementIds.forEach((elementId) => components.push({ role, elementId }));
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Revisa los campos indicados del Grupo EPA.");
      return;
    }

    const groupData = {
      code: normalizedCode,
      components,
      description: description.trim() || undefined,
    };

    toast.promise(
      execute(`${elementApi}fall-protection-groups`, "POST", groupData),
      {
        loading: "Creando Grupo EPA...",
        success: (result) => {
          setTimeout(() => navigate("/admin/inventory/harness"), 1200);
          return result.message || "Grupo EPA creado exitosamente.";
        },
        error: (error) => error.message || "No se pudo crear el Grupo EPA.",
      },
    );
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Form name="REGISTRAR GRUPO EPA" handleSubmit={handleSubmit}>
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900">
          <p className="font-bold">¿Qué se registrará?</p>
          <p className="mt-1">
            Un Grupo EPA reúne componentes de protección anticaída ya registrados.
            Cada componente conserva su propio código y el grupo recibe un código independiente.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2">
          <label htmlFor="groupCode" className="font-semibold">
            Código del Grupo EPA
          </label>
          <input
            id="groupCode"
            name="groupCode"
            type="text"
            value={code}
            maxLength={60}
            aria-invalid={Boolean(errors.code)}
            aria-describedby={errors.code ? "groupCode-error" : undefined}
            className={`w-full rounded-sm border p-2 focus:outline-[#0047a3] ${
              errors.code ? "border-red-600" : "border-gray-400"
            }`}
            onChange={(event) => {
              setCode(event.target.value);
              setErrors((current) => ({ ...current, code: undefined }));
            }}
          />
          {errors.code ? (
            <p id="groupCode-error" className="text-2xs text-red-600">
              {errors.code}
            </p>
          ) : (
            <p className="text-2xs text-gray-500">Ejemplo: EPA-001.</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-base font-extrabold text-gray-900">Componentes del grupo</h2>
          <p className="text-xs text-gray-500">
            Selecciona al menos un componente de cada categoría.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FallProtectionPartList
            label="Arnés"
            emptyLabel="arneses"
            values={harnessElementIds}
            onChange={(values) => updateRole("harness", values, setHarnessElementIds)}
            elements={elementsByRole.harness}
            error={errors.harness}
          />
          <FallProtectionPartList
            label="Banda de anclaje"
            emptyLabel="bandas de anclaje"
            values={anchorBandElementIds}
            onChange={(values) =>
              updateRole("anchorBand", values, setAnchorBandElementIds)
            }
            elements={elementsByRole.anchorBand}
            error={errors.anchorBand}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FallProtectionPartList
            label="Línea de vida"
            emptyLabel="líneas de vida"
            values={lifelineElementIds}
            onChange={(values) => updateRole("lifeline", values, setLifelineElementIds)}
            elements={elementsByRole.lifeline}
            error={errors.lifeline}
          />
          <FallProtectionPartList
            label="Eslinga de posicionamiento"
            emptyLabel="eslingas de posicionamiento"
            values={positioningLanyardElementIds}
            onChange={(values) =>
              updateRole(
                "positioningLanyard",
                values,
                setPositioningLanyardElementIds,
              )
            }
            elements={elementsByRole.positioningLanyard}
            error={errors.positioningLanyard}
          />
        </div>

        <TextAreaForm
          label="Descripción del grupo"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          optional={true}
        />

        <ButtonContainer>
          <ReturnButton onClick={() => navigate("/admin/inventory/harness")} />
          <ButtonSubmit
            label="Crear Grupo EPA"
            loadingLabel="Creando Grupo EPA..."
            loading={loading}
          />
        </ButtonContainer>
      </Form>
    </>
  );
}

function FallProtectionPartList({
  label,
  emptyLabel,
  values,
  onChange,
  elements,
  error,
}: {
  label: string;
  emptyLabel: string;
  values: string[];
  onChange: (values: string[]) => void;
  elements: ElementType[];
  error?: string;
}) {
  const updateValue = (index: number, value: string) => {
    onChange(values.map((item, itemIndex) => (itemIndex === index ? value : item)));
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
      <label className="font-semibold">{label}</label>
      {!elements.length ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-2xs text-amber-900">
          No hay {emptyLabel} registrados. Registra primero el componente desde la vista
          Elementos EPA.
        </p>
      ) : null}
      {values.map((value, index) => (
        <div key={`${label}-${index}`} className="grid grid-cols-[1fr_auto] gap-2">
          <select
            aria-invalid={Boolean(error)}
            className={`w-full rounded-sm border p-2 focus:outline-[#0047a3] ${
              error ? "border-red-600" : "border-gray-400"
            }`}
            value={value}
            onChange={(event) => updateValue(index, event.target.value)}
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
            className="rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
            onClick={() => removeValue(index)}
          >
            Quitar
          </button>
        </div>
      ))}
      {error ? <p className="text-2xs text-red-600">{error}</p> : null}
      <button
        type="button"
        className="w-fit rounded-md border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!elements.length}
        onClick={() => onChange([...values, ""])}
      >
        + Añadir {label.toLowerCase()}
      </button>
    </div>
  );
}
