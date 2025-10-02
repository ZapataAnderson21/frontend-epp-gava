interface Column<T> {
  key: keyof T;
  label: string;
  width?: string; // tailwind width (ej: "w-32")
}

interface TableProps<T> {
  data: T[];
  columns: readonly Column<T>[];
  getHref?: (item: T) => string;
}

export default function Table<T>({ data, columns, getHref }: TableProps<T>) {
  return (
    <div className="flex flex-col w-full border border-gray-200 rounded-lg text-gray-700">
      <div className="flex flex-col overflow-auto">
        {/* Header */}
        <div className="flex flex-row min-w-fit items-center justify-between bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 gap-4 p-4">
          {columns.map((col) => (
            <span
              key={String(col.key)}
              style={{ minWidth: col.width }}
              className={`flex items-start justify-start text-nowrap`}
            >
              {col.label}
            </span>
          ))}
        </div>

        {/* Rows */}
        {data.map((item, idx) => {
          const rowContent = (
            <div
              className={`flex flex-row min-w-full items-center justify-between gap-4 p-4 ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
              } hover:bg-[#eff2ff] cursor-pointer`}
            >
              {columns.map((col) => (
                <span
                  key={String(col.key)}
                  style={{ minWidth: col.width }}
                  className={`flex items-start justify-start text-nowrap`}
                >
                  {String(item[col.key] ?? "")}
                </span>
              ))}
            </div>
          );

          return getHref ? (
            <a key={idx} href={getHref(item)} className="min-w-full">
              {rowContent}
            </a>
          ) : (
            <div key={idx} className="min-w-full">
              {rowContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
