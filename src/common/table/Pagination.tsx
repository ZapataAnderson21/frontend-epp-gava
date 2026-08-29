import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  disabled?: boolean;
}

type PageItem = number | "start-ellipsis" | "end-ellipsis";

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) return [1, 2, 3, 4, 5, "end-ellipsis", totalPages];
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "start-ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ];
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  disabled = false,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const pageItems = getPageItems(currentPage, safeTotalPages);
  const buttonClass =
    "cursor-pointer inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 transition hover:border-[#0047a3] hover:text-[#0047a3] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      className="mt-4 flex w-full flex-col gap-3 border-t border-gray-100 pt-4 lg:flex-row lg:items-center lg:justify-between"
      aria-label="Paginación de la tabla"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
        <span>
          Mostrando <strong>{startItem}</strong>–<strong>{endItem}</strong> de{" "}
          <strong>{totalItems}</strong>
        </span>

        {onPageSizeChange ? (
          <label className="flex items-center gap-2">
            <span>Filas por página</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              disabled={disabled}
              className="h-9 rounded-md border border-gray-300 bg-white px-2 text-xs font-bold outline-none focus:border-[#0047a3]"
              aria-label="Filas por página"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-2 text-xs font-semibold text-gray-600 sm:hidden">
          Página {currentPage} de {safeTotalPages}
        </span>
        <button
          type="button"
          className={`${buttonClass} hidden sm:inline-flex`}
          onClick={() => onPageChange(1)}
          disabled={disabled || currentPage <= 1}
          aria-label="Primera página"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {pageItems.map((item) =>
            typeof item === "number" ? (
              <button
                type="button"
                key={item}
                className={`${buttonClass} ${
                  item === currentPage
                    ? "border-[#0047a3] bg-[#0047a3] hover:text-white"
                    : ""
                }`}
                onClick={() => onPageChange(item)}
                disabled={disabled}
                aria-label={`Página ${item}`}
                aria-current={item === currentPage ? "page" : undefined}
              >
                {item}
              </button>
            ) : (
              <span key={item} className="inline-flex h-9 min-w-7 items-center justify-center text-gray-400">
                …
              </span>
            ),
          )}
        </div>

        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage >= safeTotalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
        <button
          type="button"
          className={`${buttonClass} hidden sm:inline-flex`}
          onClick={() => onPageChange(safeTotalPages)}
          disabled={disabled || currentPage >= safeTotalPages}
          aria-label="Última página"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </nav>
  );
}
