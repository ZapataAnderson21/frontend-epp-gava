interface PanelProps {
  children?: React.ReactNode;
}

export default function Panel({ children }: PanelProps) {
  return (
    <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-6">
      {children}
    </div>
  )
}
