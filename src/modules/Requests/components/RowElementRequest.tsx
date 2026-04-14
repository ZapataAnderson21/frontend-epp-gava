import { IoIosCloseCircle } from "react-icons/io";
import type { ElementRequestType, ElementType } from "../../../data/types";

interface RowElementRequestProps {
  elementRequest: ElementRequestType;
  handleRemoveElement: (element: ElementType) => void;
  handleChangeElementRequest: (
    elementId: number,
    field: keyof ElementRequestType,
    value: string | number,
  ) => void;
  showPlanningButton?: boolean;
  planningSummary?: string;
  onOpenPlanning?: (elementRequest: ElementRequestType) => void;
  allowDecimals?: boolean;
}

export default function RowElementRequest({
  elementRequest,
  handleRemoveElement,
  handleChangeElementRequest,
  showPlanningButton = false,
  planningSummary,
  onOpenPlanning,
  allowDecimals = false,
}: RowElementRequestProps) {
  const elementLabel = elementRequest.element?.code
    ? `${elementRequest.element.name} - ${elementRequest.element.code}`
    : elementRequest.element?.name;

  return (
    <div className="flex flex-row items-center justify-between w-full gap-4 border-b border-gray-200 p-2 hover:rounded-lg hover:bg-[#eff2ff]">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{elementLabel}</span>
        {planningSummary ? (
          <span className="text-xs text-gray-500">{planningSummary}</span>
        ) : null}
      </div>

      <input
        type="text"
        className="w-28 rounded-md border border-gray-300 px-2 py-1"
        placeholder="Unidad"
        value={elementRequest.unit ?? ""}
        onChange={(e) =>
          handleChangeElementRequest(elementRequest.elementId, "unit", e.target.value)
        }
      />

      <input
        type="number"
        min="0"
        step={allowDecimals ? "0.01" : "1"}
        className="w-28 rounded-md border border-gray-300 px-2 py-1"
        placeholder="Cantidad"
        value={elementRequest.quantityRequested ?? 0}
        onChange={(e) =>
          handleChangeElementRequest(
            elementRequest.elementId,
            "quantityRequested",
            Number(e.target.value || 0),
          )
        }
      />

      {showPlanningButton ? (
        <button
          type="button"
          className="rounded-md border border-[#0047a3] px-3 py-1 text-xs font-semibold text-[#0047a3] hover:bg-[#eff6ff]"
          onClick={() => onOpenPlanning?.(elementRequest)}
        >
          Detalles
        </button>
      ) : (
        <span className="w-[72px]" />
      )}

      <IoIosCloseCircle
        className="size-6 cursor-pointer text-red-500 hover:scale-110"
        onClick={() => handleRemoveElement(elementRequest.element!)}
      />
    </div>
  );
}
