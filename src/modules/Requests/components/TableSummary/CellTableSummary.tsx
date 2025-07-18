interface CellTableSummaryProps {
  value: string | number | undefined;
}

function CellTableSummary({ value }: CellTableSummaryProps) {
  return (
    <div className="flex items-center border-2 border-gray-800 h-full w-full text-start px-3 py-1 rounded-md overflow-x-auto">
      <p className="flex w-full justify-center">{value ?? '-'}</p>
    </div>
  )
}

export default CellTableSummary