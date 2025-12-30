import { IoIosCloseCircle } from "react-icons/io";
import type { ElementType , ElementRequestType } from "../../../data/types";

interface RowElementRequestProps {
  elementRequest: ElementRequestType;
  handleRemoveElement: (element: ElementType) => void;
  handleChangeElementRequest: (elementId: number, field: keyof ElementRequestType, value: string | number) => void;
}

export default function RowElementRequest({ elementRequest, handleRemoveElement, handleChangeElementRequest }: RowElementRequestProps) {
  return (
    <div className="flex flex-row items-center justify-between w-full p-2 border-b border-gray-200 
                    gap-4 hover:rounded-lg hover:bg-[#eff2ff] cursor-pointer">
      <span className="flex items-start justify-start w-48 xl:text-nowrap">{elementRequest.element?.name}</span>

      <input
        type="text"
        className="flex items-start justify-start w-28 border border-gray-300 rounded-md px-2 py-1"
        placeholder="Unidad"
        value={elementRequest.unit ?? ""}
        onChange={(e) => handleChangeElementRequest(elementRequest.elementId, "unit", e.target.value)}
      />

      <input
        type="number"
        className="flex items-start justify-start w-28 border border-gray-300 rounded-md px-2 py-1"
        placeholder="Cantidad"
        value={elementRequest.quantityRequested ?? 0}
        onChange={(e) => handleChangeElementRequest(elementRequest.elementId, "quantityRequested", Number(e.target.value))}
      />

      <IoIosCloseCircle
        className="text-red-500 cursor-pointer size-6 hover:scale-115"
        onClick={() => handleRemoveElement(elementRequest.element!)}
      />
    </div>
  );
}