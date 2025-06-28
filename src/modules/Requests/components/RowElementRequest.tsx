import { IoIosCloseCircle } from "react-icons/io";
import type { Element, ElementRequest } from "../../../Types";

interface RowElementRequestProps {
  elementRequest: ElementRequest;
  handleRemoveElement: (element: Element) => void;
  handleChangeElementRequest: (element_id: number, field: keyof ElementRequest, value: string | number) => void;
}

export default function RowElementRequest({ elementRequest, handleRemoveElement, handleChangeElementRequest }: RowElementRequestProps) {
  return (
    <div className="flex flex-row items-center justify-between w-full p-4 border-b border-gray-200 
                    gap-4 hover:rounded-lg hover:bg-[#eff2ff] cursor-pointer">
      <span className="flex items-start justify-start w-36">{elementRequest.element?.name}</span>

      <input
        type="text"
        className="flex items-start justify-start w-20 sm:w-24 border border-gray-300 rounded-md px-2 py-1"
        placeholder="Unidad"
        value={elementRequest.unit}
        onChange={(e) => handleChangeElementRequest(elementRequest.element_id, "unit", e.target.value)}
      />

      <input
        type="number"
        className="flex items-start justify-start w-12 sm:w-24 border border-gray-300 rounded-md px-2 py-1"
        placeholder="Cantidad"
        value={elementRequest.quantity_requested}
        onChange={(e) => handleChangeElementRequest(elementRequest.element_id, "quantity_requested", e.target.value)}
      />

      <IoIosCloseCircle
        className="text-red-500 cursor-pointer size-6 hover:scale-115"
        onClick={() => handleRemoveElement(elementRequest.element!)}
      />
    </div>
  );
}