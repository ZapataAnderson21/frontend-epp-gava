import type { ElementRequestType, RequestType } from '../../../../data/types';
import RowTableSummary from './RowTableSummary';

interface ContentTableSummaryProps {
  request: RequestType;
  onQuantityChange: (id: number, quantity: number) => void;
  elementRequests?: ElementRequestType[];
}

export default function ContentTableSummary({ request, onQuantityChange, elementRequests }: ContentTableSummaryProps) {
  const rows = elementRequests ?? request?.elementRequests ?? [];

  return (
    <div className="flex flex-col items-start justify-start w-full">
      {rows.map((item, index) => (
        <RowTableSummary 
          key={index} 
          elementRequest={item} 
          onQuantityChange={onQuantityChange} 
        />
      ))}
    </div>
  )
}