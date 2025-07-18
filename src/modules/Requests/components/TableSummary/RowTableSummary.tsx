import { useState } from 'react';
import type { ElementRequestType } from '../../../../data/elementRequestData';
import CellTableSummary from './CellTableSummary';

interface RowTableSummaryProps {
  elementRequest: ElementRequestType;
  onQuantityChange: (id: number, quantity: number) => void;
}

export default function RowTableSummary({ elementRequest, onQuantityChange }: RowTableSummaryProps) {
  const [quantity_accepted, setQuantityAccepted] = useState<number>(elementRequest.elementRequestResponses?.[0]?.quantity_accepted || 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setQuantityAccepted(value);
    onQuantityChange(elementRequest.element_request_id, value);
  };

  return (
    <div className="grid grid-cols-4 w-full max-w-2xl h-full text-[14px] text-gray-700 gap-1 mt-1">
      <CellTableSummary value={elementRequest.element?.name} />
      <CellTableSummary value={elementRequest.unit} />
      <CellTableSummary value={elementRequest.quantity_requested} />
      <input
        type="number"
        className="border-2 border-gray-800 w-full h-full text-center px-3 py-1 rounded-md bg-yellow-400 font-semibold"
        placeholder={elementRequest.quantity_requested.toString()}
        value={quantity_accepted}
        onChange={handleChange}
      />
    </div>
  );
}
