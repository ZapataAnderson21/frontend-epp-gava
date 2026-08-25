interface ColumnCardProps {
  title: string;
  children: React.ReactNode;
}

export default function ColumnCard({ title, children }: ColumnCardProps) {
  return (
    <div className="bg-white shadow-md rounded-xl p-4 w-full">
      <h3 className="text-base font-extrabold text-gray-800 mb-4">{title}</h3>
      <div>
        {children}
      </div>
    </div>
  );
}