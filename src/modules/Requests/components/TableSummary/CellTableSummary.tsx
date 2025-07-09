interface CellTableSummaryProps {
  value: string | number | undefined;
}

function CellTableSummary({ value }: CellTableSummaryProps) {
  return (
    <div className="flex items-center justify-center border-2 border-gray-800 h-full w-full text-center px-3 py-1 rounded-md">{value ?? '-'}</div>
  )
}

export default CellTableSummary