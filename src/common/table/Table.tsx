import { AnimatePresence, motion } from "framer-motion";
import Pagination from "./Pagination";
import type { PaginationMeta } from "./pagination.types";
import { usePagination } from "./usePagination";

export type Column<T> = {
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
  itemsPerPage?: number;
  enablePagination?: boolean;
  pagination?: PaginationMeta | null;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  loading?: boolean;
  rowClassName?: (row: T, index: number) => string | undefined;
  getRowKey?: (row: T, index: number) => React.Key;
}

export default function Table<T>({
  data,
  columns,
  itemsPerPage = 10,
  enablePagination = true,
  pagination,
  onPageChange,
  onPageSizeChange,
  loading = false,
  rowClassName,
  getRowKey,
}: TableProps<T>) {
  const localPagination = usePagination({ data, itemsPerPage });
  const usesServerPagination = Boolean(pagination && onPageChange);
  const displayData = usesServerPagination
    ? data
    : enablePagination
      ? localPagination.paginatedData
      : data;
  const currentPage = pagination?.currentPage ?? localPagination.currentPage;
  const totalPages = pagination?.totalPages ?? localPagination.totalPages;
  const totalItems = pagination?.totalItems ?? data.length;
  const pageSize = pagination?.pageSize ?? itemsPerPage;
  const changePage = onPageChange ?? localPagination.goToPage;

  const rowVariants = {
    hidden: { opacity: 0, y: 1 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, delay: (index * 40) / 1000 },
    }),
  };

  const cellAlign = (align?: "left" | "center" | "right") =>
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";

  return (
    <div className="w-full min-w-0">
      <div className="w-full min-w-0 overflow-x-auto rounded-lg border border-gray-100 bg-white">
        <table className="w-full min-w-full whitespace-nowrap text-gray-700">
          <colgroup>
            {columns.map((column, index) => (
              <col key={String(column.key ?? `col-${index}`)} style={{ width: column.width }} />
            ))}
          </colgroup>
          <thead className="bg-gray-100 font-semibold">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={String(column.key ?? `head-${index}`)}
                  scope="col"
                  className={`px-4 py-3 font-semibold ${
                    column.truncate ? "truncate" : ""
                  } ${cellAlign(column.align)}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody aria-busy={loading}>
            <AnimatePresence initial={false}>
              {displayData.map((item, index) => {
                const customClass = rowClassName?.(item, index);
                const rowClasses = customClass
                  ? `border-t border-gray-100 hover:bg-[#eff2ff] ${customClass}`
                  : `border-t border-gray-100 hover:bg-[#eff2ff] ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`;

                return (
                  <motion.tr
                    key={getRowKey?.(item, index) ?? index}
                    className={rowClasses}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0 }}
                    custom={index}
                  >
                    {columns.map((column, columnIndex) => (
                      <td
                        key={String(column.key ?? `cell-${columnIndex}`)}
                        className={`px-4 py-3 ${
                          column.truncate ? "max-w-0 truncate" : ""
                        } ${cellAlign(column.align)}`}
                      >
                        {column.render
                          ? column.render(item)
                          : String(item[column.key as keyof T] ?? "")}
                      </td>
                    ))}
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {enablePagination ? (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={changePage}
          onPageSizeChange={usesServerPagination ? onPageSizeChange : undefined}
          disabled={loading}
        />
      ) : null}
    </div>
  );
}
