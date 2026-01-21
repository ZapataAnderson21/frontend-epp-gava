import { useState } from 'react';
import type { ElementRequestType } from '../../../../data/types';
import CellTableSummary from './CellTableSummary';

interface RowTableSummaryProps {
  elementRequest: ElementRequestType;
  onQuantityChange: (id: number, quantity: number) => void;
}

export default function RowTableSummary({ elementRequest, onQuantityChange }: RowTableSummaryProps) {
  const [quantityAccepted, setQuantityAccepted] = useState<number>(elementRequest.elementRequestResponses?.[0]?.quantityAccepted || 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setQuantityAccepted(value);
    if (typeof elementRequest.elementRequestId === 'number') {
      onQuantityChange(elementRequest.elementRequestId, value);
    }
  };

  return (
    <div className="grid w-full h-full text-[14px] text-gray-700 gap-1 mt-1" style={{ gridTemplateColumns: '1fr 144px 112px 112px' }}>
      <CellTableSummary value={elementRequest.element?.name} className="w-full" />
      <CellTableSummary value={elementRequest.unit} className="w-full" />
      <CellTableSummary value={elementRequest.quantityRequested} className="w-full" />
      <input
        type="number"
        className="border-2 border-gray-800 w-full h-full text-center px-3 py-1 rounded-md bg-yellow-400 font-semibold"
        placeholder={elementRequest.quantityRequested.toString()}
        value={quantityAccepted}
        onChange={handleChange}
      />
    </div>
  );
}
