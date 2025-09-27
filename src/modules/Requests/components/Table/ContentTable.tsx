import { useState, useEffect } from "react";
import RowTable from "./RowTable";
import { requestApi } from "../../../../data/apiUrl";
import type { RequestType } from "../../../../data/types";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import LoadingSkeletonTable from "../../../../common/LoadingSkeletonTable";
import HeaderTable from "./HeaderTable";
import ErrorMessage from "../../../../common/ErrorMessage";
import { useFetch } from "../../../../hooks/useFetch";

export default function ContentTable() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userType = user.userType;

  const [requests, setRequests] = useState<RequestType[]>([]);
  const [pages, setPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const itemsPerPage = 10;

  // 👉 URL dinámica según tipo de usuario
  const url =
    ["ADMINISTRADORA", "LOGISTICA", "GERENTE"].includes(userType)
      ? requestApi // /request
      : `${requestApi}user/${user.user_id}`; // /request/user/:id

  // 👉 Hook genérico con token incluido
  const { data, loading, error } = useFetch<RequestType[]>(url, [url]);

  // 👉 Post-procesamiento (filtros, reverse, paginación)
  useEffect(() => {
    if (!data) return;

    let processed = [...data];

    if (["ADMINISTRADORA", "LOGISTICA", "GERENTE"].includes(userType)) {
      processed = processed.filter(
        (req) => (req.status ?? "").trim().toLowerCase() !== "draft"
      );
    }

    processed = processed.reverse();

    setRequests(processed);
    setPages(Math.ceil(processed.length / itemsPerPage));
    setCurrentPage(1); // reset página al cambiar datos
  }, [data, userType]);

  // 👉 Items actuales según página
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = requests.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (!requests.length) return <p className="text-gray-500">No hay solicitudes.</p>;

  return (
    <>
      <div className="flex flex-col items-center justify-between min-w-full">
        <HeaderTable />
        {currentRequests.map((request, index) => (
          <RowTable
            key={request.request_id}
            id={request.request_id}
            order={indexOfFirstItem + index + 1}
            createdAt={request.createdAt}
            status={request.status}
            deliveryDueDate={request.delivery_due_date}
            user={request.user?.name || "Desconocido"}
          />
        ))}
      </div>

      {/* Paginador */}
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
    </>
  );
}
