interface CellTableSummaryProps {
  value: string | number | undefined;
  className?: string;
}

export default function CellTableSummary({ value, className = '' }: CellTableSummaryProps) {
  return (
    <div className={`flex items-center border-2 border-gray-800 h-full text-start px-3 py-1 rounded-md overflow-hidden ${className}`}>
      <p className="flex w-full justify-center break-words text-center">{value ?? '-'}</p>
    </div>
  )
}