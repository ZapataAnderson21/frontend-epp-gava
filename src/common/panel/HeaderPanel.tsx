interface PanelProps {
  loading?: boolean;
  name: string;
  children?: React.ReactNode;
}

export default function HeaderPanel({ name, children, loading }: PanelProps) {
  return (
    <div className="flex flex-row flex-wrap gap-4 items-center justify-between w-full mb-4">
      <div className="flex flex-row items-center gap-4">
        <h1 className="text-3xl font-extrabold sm:mb-0">{ loading ? "Cargando..." : name.toUpperCase()} </h1>
      </div>
      <div className="flex flex-row items-end justify-end w-full gap-2">
        {children}
      </div>
    </div>
  )
}
