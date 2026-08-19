import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaBookmark, FaCheck, FaMinus, FaPlus, FaSearch } from "react-icons/fa";
import { purchaseOrderConditionApi } from "../../../../../../../data/apiUrl";
import type {
  PurchaseOrderCondition,
  PurchaseOrderConditionType,
} from "../../../../../../../data/types";
import { useApiAction, useFetch } from "../../../../../../../hooks";

interface SectionProps {
  title: string;
  conditionType: PurchaseOrderConditionType;
  values: string[];
  onAdd: (value?: string) => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, value: string) => void;
  placeholderBase: string;
}

function ConditionsSection({
  title,
  conditionType,
  values,
  onAdd,
  onRemove,
  onChange,
  placeholderBase,
}: SectionProps) {
  const [search, setSearch] = useState("");
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const conditionLabel = conditionType === "commercial" ? "comercial" : "de calidad";
  const conditionUrl = `${purchaseOrderConditionApi}?type=${conditionType}`;
  const {
    data: savedConditions,
    loading,
    error,
    refetch,
  } = useFetch<PurchaseOrderCondition[]>(conditionUrl, [conditionType]);
  const { execute } = useApiAction<PurchaseOrderCondition>();

  const filteredConditions = useMemo(() => {
    const query = normalizeCondition(search);
    if (!query) return [];

    return (savedConditions ?? [])
      .filter((condition) => normalizeCondition(condition.content).includes(query))
      .slice(0, 8);
  }, [savedConditions, search]);

  const isSaved = (value: string) => {
    const normalizedValue = normalizeCondition(value);
    return Boolean(
      normalizedValue &&
        savedConditions?.some(
          (condition) => normalizeCondition(condition.content) === normalizedValue,
        ),
    );
  };

  const addSavedCondition = (content: string) => {
    const normalizedContent = normalizeCondition(content);
    const alreadyAdded = values.some(
      (value) => normalizeCondition(value) === normalizedContent,
    );

    if (alreadyAdded) {
      toast.error("Esta condición ya fue agregada a la orden.");
      return;
    }

    const emptyIndex = values.findIndex((value) => !value.trim());
    if (emptyIndex >= 0) {
      onChange(emptyIndex, content);
    } else {
      onAdd(content);
    }
    setSearch("");
  };

  const saveCondition = async (index: number, value: string) => {
    const content = value.trim();
    if (!content) {
      toast.error("Escribe una condición antes de guardarla.");
      return;
    }

    setSavingIndex(index);
    try {
      const response = await execute(purchaseOrderConditionApi, "POST", {
        type: conditionType,
        content,
      });
      toast.success(response.message);
      refetch();
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar la condición.",
      );
    } finally {
      setSavingIndex(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-bold">{title}</h1>

      <div className="rounded-md border border-blue-100 bg-blue-50/60 p-3">
        <label
          className="mb-2 block text-sm font-bold text-gray-700"
          htmlFor={`saved-condition-search-${conditionType}`}
        >
          Buscar una condición {conditionLabel} guardada
        </label>
        <div className="relative">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id={`saved-condition-search-${conditionType}`}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Buscar condición ${conditionLabel}...`}
            className="w-full rounded-md border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#0047a3]"
          />
        </div>

        {search.trim() ? (
          <div className="mt-2 max-h-52 overflow-y-auto rounded-md border border-gray-200 bg-white">
            {loading ? (
              <p className="p-3 text-sm text-gray-500">Buscando condiciones...</p>
            ) : filteredConditions.length ? (
              filteredConditions.map((condition) => (
                <button
                  key={condition.purchaseOrderConditionId}
                  type="button"
                  onClick={() => addSavedCondition(condition.content)}
                  className="flex w-full items-start justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-blue-50"
                >
                  <span>{condition.content}</span>
                  <span className="shrink-0 font-bold text-[#0047a3]">Agregar</span>
                </button>
              ))
            ) : (
              <p className="p-3 text-sm text-gray-500">
                No se encontraron condiciones guardadas con ese texto.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-500">
            Escribe para buscar o redacta una condición nueva debajo.
          </p>
        )}

        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      </div>

      <div className="flex flex-col items-center gap-2">
        {values.map((val, idx) => (
          <div key={idx} className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className="block w-full cursor-text rounded-sm border border-gray-300 p-2.5 text-gray-900 focus:outline-[#0047a3]"
              type="text"
              value={val}
              onChange={(e) => onChange(idx, e.target.value)}
              placeholder={`${placeholderBase} ${idx + 1}`}
              maxLength={500}
            />

            <div className="flex shrink-0 gap-2 text-sm">
              <button
                type="button"
                onClick={() => saveCondition(idx, val)}
                disabled={!val.trim() || savingIndex === idx || isSaved(val)}
                className={`flex min-w-28 items-center justify-center gap-2 rounded-md px-3 py-2 font-bold text-white ${
                  isSaved(val)
                    ? "cursor-default bg-emerald-600"
                    : "bg-[#0047a3] hover:bg-[#003b88] disabled:cursor-not-allowed disabled:bg-gray-300"
                }`}
                title={`Guardar condición ${conditionLabel}`}
              >
                {isSaved(val) ? <FaCheck /> : <FaBookmark />}
                {savingIndex === idx ? "Guardando..." : isSaved(val) ? "Guardada" : "Guardar"}
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-md bg-red-500 p-2 text-white hover:bg-red-600"
                onClick={() => onRemove(idx)}
                aria-label={`Eliminar ${placeholderBase.toLowerCase()} ${idx + 1}`}
              >
                <FaMinus />
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-md bg-black p-2 text-white hover:bg-gray-800"
                onClick={() => onAdd()}
                aria-label={`Agregar ${placeholderBase.toLowerCase()}`}
              >
                <FaPlus />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeCondition(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Inline select pequeñito reutilizable (para "materiales/servicios" u otros) */
function SelectInline({
  label, name, value, onChange, options, purchaseOrderTypeError
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  purchaseOrderTypeError?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="font-semibold text-nowrap text-gray-700" htmlFor={name}>{label}</label>
      <div className="relative w-fit">
        <select
          id={name}
          className={`p-[10px] border ${purchaseOrderTypeError ? "border-red-500" : "border-gray-400"} rounded-sm  focus:outline-[#0047a3]`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>Seleccionar...</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {purchaseOrderTypeError && <span className="absolute text-nowrap text-xs top-12 left-0 text-red-500">{purchaseOrderTypeError}</span>}
      </div>
    </div>
  );
}

const ConditionsSectionWithSelect = Object.assign(ConditionsSection, {
  SelectInline,
});

export default ConditionsSectionWithSelect;
