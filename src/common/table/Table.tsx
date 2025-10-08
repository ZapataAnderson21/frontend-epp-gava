import { Link } from "react-router-dom";

interface Column<T> {
  key: keyof T;
  label: string;
  width?: string;
  truncate?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: readonly Column<T>[];
  getHref?: (item: T) => string;
}

export default function Table<T>({ data, columns, getHref }: TableProps<T>) {
  return (
    <div className="w-full text-nowrap">
      <div className="overflow-auto">
        <div className="table w-full border border-gray-200 text-gray-700 rounded-lg">
          {/* Header */}
          <div className="table-header-group bg-gray-100 font-semibold">
            <div className="table-row">
              {columns.map((col) => (
                <div
                  key={String(col.key)}
                  className={`table-cell px-4 py-3 ${col.truncate ? "truncate" : ""}`}
                  style={{ width: col.width }}
                >
                  {col.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="table-row-group">
            {data.map((item, idx) => {
              const href = getHref ? getHref(item) : undefined;
              const RowContent = (
                <>
                  {columns.map((col) => (
                    <div
                      key={String(col.key)}
                      className={`table-cell px-4 py-3 ${col.truncate ? "truncate" : ""}`}
                      style={{ width: col.width }}
                    >
                      {String(item[col.key] ?? "")}
                    </div>
                  ))}
                </>
              );

              return href ? (
                <Link
                  key={idx}
                  to={href}
                  className={`table-row ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[#eff2ff] cursor-pointer`}
                >
                  {RowContent}
                </Link>
              ) : (
                <div
                  key={idx}
                  className={`table-row ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  {RowContent}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
