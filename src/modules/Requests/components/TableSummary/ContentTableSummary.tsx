import type { RequestType } from '../../../../data/types';
import RowTableSummary from './RowTableSummary';

interface ContentTableSummaryProps {
  request: RequestType;
  onQuantityChange: (id: number, quantity: number) => void;
}

export default function ContentTableSummary({ request, onQuantityChange }: ContentTableSummaryProps) {
  return (
    <div className="flex flex-col items-start justify-start w-full max-w-2xl">
      {request?.elementRequests?.map((item, index) => (
        <RowTableSummary 
          key={index} 
          elementRequest={item} 
          onQuantityChange={onQuantityChange} 
        />
      ))}
    </div>
  )
}