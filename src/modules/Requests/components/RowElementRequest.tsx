import { CircleX as IoIosCloseCircle } from "lucide-react";
import type { ElementRequestType } from "../../../data/types";
import {
  getRequestLineFamily,
  getRequestLineKey,
  shouldShowRequestLineNotes,
  usesUniqueRequestQuantity,
} from "../requestLineUtils";

interface RowElementRequestProps {
  elementRequest: ElementRequestType;
  handleRemoveElement: (lineKey: string) => void;
  handleChangeElementRequest: (
    lineKey: string,
    field: keyof ElementRequestType,
    value: string | number | null,
  ) => void;
  showPlanningButton?: boolean;
  planningSummary?: string;
  onOpenPlanning?: (elementRequest: ElementRequestType) => void;
  allowDecimals?: boolean;
  showQuantityField?: boolean;
}

export default function RowElementRequest({
  elementRequest,
  handleRemoveElement,
  handleChangeElementRequest,
  showPlanningButton = false,
  planningSummary,
  onOpenPlanning,
  allowDecimals = false,
  showQuantityField = true,
}: RowElementRequestProps) {
  const lineKey = getRequestLineKey(elementRequest);
  const family = getRequestLineFamily(elementRequest);
  const isUnique = usesUniqueRequestQuantity(elementRequest);
  const showNotesField = shouldShowRequestLineNotes(elementRequest);
  const groupParts = getFallProtectionGroupParts(elementRequest);
  const elementLabel = elementRequest.fallProtectionGroup?.code
    || (elementRequest.element?.code
      ? `${elementRequest.element.name} - ${elementRequest.element.code}`
      : elementRequest.element?.name);
  const helperText =
    family === "harness" ? groupParts : planningSummary;
  const gridClass = getRowGridClass(showQuantityField);

  return (
    <div className="w-full max-w-4xl border-b border-gray-200 p-3 hover:rounded-lg hover:bg-[#eff2ff]">
      <div className={`grid w-full grid-cols-1 items-start gap-3 lg:items-center lg:gap-4 ${gridClass}`}>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{elementLabel}</span>
          {helperText ? (
            <span className="text-2xs text-gray-500">{helperText}</span>
          ) : null}
        </div>

        {showQuantityField ? (
          <input
            type="number"
            min={family === "ssomaSupply" ? "1" : "0"}
            step={allowDecimals ? "0.01" : "1"}
            disabled={isUnique}
            className={`w-28 rounded-md border border-gray-300 px-2 py-1 ${
              isUnique ? "cursor-not-allowed bg-gray-100 text-gray-500" : ""
            }`}
            placeholder="Cantidad"
            value={isUnique ? 1 : elementRequest.quantityRequested ?? 0}
            onChange={(e) =>
              handleChangeElementRequest(
                lineKey,
                "quantityRequested",
                Number(e.target.value || 0),
              )
            }
          />
        ) : null}

        {showNotesField ? (
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs lg:px-2 lg:py-1"
            placeholder="Descripcion..."
            value={elementRequest.notes ?? ""}
            onChange={(e) =>
              handleChangeElementRequest(lineKey, "notes", e.target.value)
            }
          />
        ) : (
          <span className="hidden lg:block" />
        )}

        <div className="flex w-[116px] items-center justify-end gap-2">
          {showPlanningButton ? (
            <button
              type="button"
              className="rounded-md border border-[#0047a3] px-3 py-1 text-2xs font-semibold text-[#0047a3] hover:bg-[#eff6ff]"
              onClick={() => onOpenPlanning?.(elementRequest)}
            >
              Detalles
            </button>
          ) : null}
        </div>

        <IoIosCloseCircle
          className="size-6 cursor-pointer text-red-500 hover:scale-110"
          onClick={() => handleRemoveElement(lineKey)}
        />
      </div>
    </div>
  );
}

function getRowGridClass(showQuantityField: boolean) {
  if (showQuantityField) {
    return "lg:grid-cols-[minmax(10rem,1fr)_7rem_minmax(12rem,18rem)_5rem_1.5rem]";
  }

  return "lg:grid-cols-[minmax(10rem,1fr)_minmax(12rem,18rem)_5rem_1.5rem]";
}

function getFallProtectionGroupParts(elementRequest: ElementRequestType) {
  const group = elementRequest.fallProtectionGroup;
  if (!group) return null;

  if (group.components?.length) {
    const roleLabels = {
      harness: "Arnes",
      anchorBand: "Banda de anclaje",
      lifeline: "Linea de vida",
      positioningLanyard: "Eslinga de posicionamiento",
    } as const;

    return group.components
      .map((component) =>
        getGroupPartLabel(roleLabels[component.role], component.element),
      )
      .join(" | ");
  }

  const parts = [
    getGroupPartLabel("Arnes", group.harnessElement),
    getGroupPartLabel("Banda de anclaje", group.anchorBandElement),
    getGroupPartLabel("Linea de vida", group.lifelineElement),
    getGroupPartLabel("Eslinga de posicionamiento", group.positioningLanyardElement),
  ];

  return parts.join(" | ");
}

function getGroupPartLabel(label: string, element?: ElementRequestType["element"]) {
  if (!element) return `${label}: pendiente`;
  return `${label}: ${element.code || element.name}`;
}
