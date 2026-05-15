import type {
  ElementRequestType,
  ElementType,
  OfficeInventoryEntry,
  RequestType,
} from '../../../../data/types';
import { groupRequestLinesBySection } from '../../requestLineUtils';
import HeaderTableSummary from './HeaderTableSummary';
import RowTableSummary from './RowTableSummary';

interface ContentTableSummaryProps {
  request: RequestType;
  onQuantityChange: (id: number, quantity: number) => void;
  onSafetySelectionChange?: (id: number, selectedElementIds: number[]) => void;
  selectedSafetyElementIds?: { [key: number]: number[] };
  elementRequests?: ElementRequestType[];
  safetyElements?: ElementType[];
  officeEntries?: OfficeInventoryEntry[];
}

export default function ContentTableSummary({
  request,
  onQuantityChange,
  onSafetySelectionChange,
  selectedSafetyElementIds,
  elementRequests,
  safetyElements,
  officeEntries,
}: ContentTableSummaryProps) {
  const rows = elementRequests ?? request?.elementRequests ?? [];
  const sections = groupRequestLinesBySection(rows);

  return (
    <div className="flex flex-col items-start justify-start w-full gap-6">
      {sections.map((section) => (
        <section key={section.key} className="w-full">
          <h2 className="text-base font-extrabold text-gray-900 mb-2">{section.label}</h2>
          <HeaderTableSummary />
          <div className="flex flex-col items-start justify-start w-full">
            {section.rows.map((item, index) => (
              <RowTableSummary
                key={item.elementRequestId ?? item.lineKey ?? `${section.key}-${index}`}
                elementRequest={item}
                onQuantityChange={onQuantityChange}
                onSafetySelectionChange={onSafetySelectionChange}
                selectedSafetyElementIds={
                  typeof item.elementRequestId === 'number'
                    ? selectedSafetyElementIds?.[item.elementRequestId]
                    : undefined
                }
                safetyElements={safetyElements}
                officeEntries={officeEntries}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
