interface RequestPropertyProps {
  label: string;
  value: string | number;
}

function RequestProperty({ label, value }: RequestPropertyProps) {
  return (
    <div className="flex flex-row items-start justify-start gap-2 w-full max-w-2xl text-[14px] text-gray-700">
      <span className="font-semibold text-nowrap">{label}:</span>
      <span>{value}</span>
    </div>
  )
}

export default RequestProperty