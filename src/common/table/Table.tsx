import { motion, AnimatePresence } from "framer-motion";

type Column<T> = {
  key?: keyof T;
  label: string;
  width?: string;
  truncate?: boolean;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
};

interface TableProps<T> {
  data: T[];
  columns: readonly Column<T>[];
}

export default function Table<T>({ data, columns }: TableProps<T>) {

  const baseDelayMs = 0;
  const perRowDelayMs = 60;

  const rowVariants = {
    hidden: { opacity: 0, y: 1 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.2, delay: (baseDelayMs + i * perRowDelayMs) / 1000 }
    })
  };

  const cellAlign = (align?: "left"|"center"|"right") =>
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <div className="w-full text-nowrap">
      <div className="overflow-auto">
        <div className="table w-full border border-gray-100 text-gray-700 rounded-lg">
          <div className="table-header-group bg-gray-100 font-semibold">
            <div className="table-row">
              {columns.map((col, i) => (
                <div
                  key={String(col.key ?? `col-${i}`)}
                  className={`table-cell px-4 py-3 ${col.truncate ? "truncate" : ""} ${cellAlign(col.align)}`}
                  style={{ width: col.width }}
                >
                  {col.label}
                </div>
              ))}
            </div>
          </div>

          <div className="table-row-group">
            <AnimatePresence>
              {data.map((item, idx) => {
                const rowClasses = `cursor-pointer hover:bg-[#eff2ff] table-row ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`;
                const cells = (
                  <>
                    {columns.map((col, i) => (
                      <div
                        key={String(col.key ?? `c-${i}`)}
                        className={`table-cell px-4 py-3 ${col.truncate ? "truncate" : ""} ${cellAlign(col.align)}`}
                        style={{ width: col.width }}
                      >
                        {col.render ? col.render(item) : String(item[col.key as keyof T] ?? "")}
                      </div>
                    ))}
                  </>
                );

                // Si NO quieres que la fila entera navegue, no pases getHref
                return (
                  <motion.div
                    key={idx}
                    className={rowClasses}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0 }}
                    custom={idx}
                  >
                    {cells}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
