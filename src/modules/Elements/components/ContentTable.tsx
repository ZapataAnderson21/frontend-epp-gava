import RowTable from "./RowTable";
import LoadingSkeletonTable from "../../../common/LoadingSkeletonTable";
import HeaderTable from "./HeaderTable";
import { useFetch } from "../../../hooks/useFetch";
import { elementApi } from "../../../data/apiUrl";
import type { ElementType } from "../../../data/types";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { useState, useMemo } from "react";
import ErrorMessage from "../../../common/ErrorMessage";

interface ContentTableProps {
  type: string;
}

export default function ContentTable({ type }: ContentTableProps) {
  // Construyo la URL dinámicamente según el `type`
  const url = type === "all" ? elementApi : `${elementApi}type/${type}`;
  const { data: elements, loading, error } = useFetch<ElementType[]>(url, []);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const pages = useMemo(
    () => Math.ceil((elements?.length ?? 0) / itemsPerPage),
    [elements]
  );

  const currentElements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return elements?.slice(start, start + itemsPerPage) ?? [];
  }, [elements, currentPage]);

  if (loading) return <LoadingSkeletonTable />

  if (error) return <ErrorMessage errorMessage={error} />

  return (
    <div className="flex flex-col items-start justify-start gap-2 overflow-auto w-full text-gray-600">
      <div className="flex flex-col items-center justify-between min-w-full">
        <HeaderTable />
        {currentElements.map((element, index) => (
          <RowTable
            key={element.element_id}
            order={(currentPage - 1) * itemsPerPage + index + 1}
            id={element.element_id}
            name={element.name}
            type={element.type}
            description={element.description}
          />
        ))}
      </div>

      {/* Paginación */}
      <div className="flex flex-row justify-end w-full font-bold mt-4 gap-2">
        <div
          className="flex items-center px-3 py-2 border-2 rounded-md hover:bg-gray-100 cursor-pointer"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          <FaArrowLeft className="size-3" />
        </div>
        {Array.from({ length: pages }, (_, i) => (
          <div
            key={i}
            className={`flex items-center px-3 py-2 border-2 rounded-md hover:bg-gray-100 cursor-pointer ${
              currentPage === i + 1 ? "bg-gray-300" : ""
            }`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </div>
        ))}
        <div
          className="flex items-center px-3 py-2 border-2 rounded-md hover:bg-gray-100 cursor-pointer"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pages))}
        >
          <FaArrowRight className="size-3" />
        </div>
      </div>
    </div>
  );
}
