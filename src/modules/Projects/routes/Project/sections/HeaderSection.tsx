
interface HeaderSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function HeaderSection({ title, children }: HeaderSectionProps) {
  return (
    <div className="flex w-full justify-between items-center">
      <h2 className="text-xl font-extrabold">{title}</h2>
      {children}
    </div>
  )
}