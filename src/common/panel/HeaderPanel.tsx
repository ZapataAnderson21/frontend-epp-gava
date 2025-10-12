interface PanelProps {
  name: string;
  children?: React.ReactNode;
}
export default function HeaderPanel({ name, children }: PanelProps) {
  return (
    <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full mb-4">
      <h1 className="text-3xl font-extrabold mb-4 sm:mb-0">{name.toUpperCase()}</h1>
      <div className="flex flex-row items-end justify-end w-fit mb-4 gap-2">
        {children}
      </div>
    </div>
  )
}
