import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const MotionLink = motion(Link);

interface Column<T> { key: keyof T; label: string; width?: string; truncate?: boolean; }
interface TableProps<T> {
  data: T[];
  columns: readonly Column<T>[];
  getHref?: (item: T) => string;
  baseDelayMs?: number;     // delay inicial
  perRowDelayMs?: number;   // delay extra por fila
}

export default function Table<T>({
  data, columns, getHref,
  baseDelayMs = 0,
  perRowDelayMs = 60
}: TableProps<T>) {

  const rowVariants = {
    hidden: { opacity: 0, y: 1 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.2, delay: (baseDelayMs + i * perRowDelayMs) / 1000 }
    })
  };

  return (
    <div className="w-full text-nowrap">
      <div className="overflow-auto">
        <div className="table w-full border border-gray-100 text-gray-700 rounded-lg">
          <div className="table-header-group bg-gray-100 font-semibold">
            <div className="table-row">
              {columns.map((col) => (
                <div key={String(col.key)} className={`table-cell px-4 py-3 ${col.truncate ? "truncate" : ""}`} style={{ width: col.width }}>
                  {col.label}
                </div>
              ))}
            </div>
          </div>

          <div className="table-row-group">
            <AnimatePresence>
              {data.map((item, idx) => {
                const href = getHref?.(item);
                const rowClasses = `table-row ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`;
                const cells = (
                  <>
                    {columns.map((col) => (
                      <div key={String(col.key)} className={`table-cell px-4 py-3 ${col.truncate ? "truncate" : ""}`} style={{ width: col.width }}>
                        {String(item[col.key] ?? "")}
                      </div>
                    ))}
                  </>
                );

                return href ? (
                  <MotionLink
                    key={idx}
                    to={href}
                    className={`${rowClasses} hover:bg-[#eff2ff] cursor-pointer`}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0 }}
                    custom={idx}         // ← pasa el índice al variant
                  >
                    {cells}
                  </MotionLink>
                ) : (
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
