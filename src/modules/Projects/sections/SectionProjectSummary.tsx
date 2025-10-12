interface PropsSectionProjectSummary {
  children?: React.ReactNode;
  title: string;
}

export default function SectionProjectSummary({ title, children }: PropsSectionProjectSummary) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <h1 className="text-xl font-extrabold">{title}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        {children}
      </div>
    </div>
  );
}
