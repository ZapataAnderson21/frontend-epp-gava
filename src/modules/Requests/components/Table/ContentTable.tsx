import { useState } from "react";
import RowTable from "./RowTable";
import { fetchGetRequestsByUser, fetchGetAllRequests, type RequestType, type RequestGetAllResponse } from "../../../../data/requestData";
import { useEffect } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

export default function ContentTable() {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userType = user.userUserTypes[0].userType.name;
  const [pages, setPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [requests, setRequests] = useState<RequestType[]>([]);

  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = requests.slice(indexOfFirstItem, indexOfLastItem);


  useEffect(() => {
    const fetchRequests = async () => {
      let data: RequestType[] = [];

      if (
        ["ADMINISTRADORA", "LOGISTICA", "GERENTE"].includes(userType)
      ) {
        const response = await fetchGetAllRequests() as RequestGetAllResponse;

        const filteredData = response.data.filter(
          (req: RequestType) => (req.status ?? "").trim().toLowerCase() !== "draft"
        );

        data = filteredData.reverse();

      } else {
        const response = await fetchGetRequestsByUser(user.user_id) as RequestGetAllResponse;
        data = response.data.reverse();
      }

      setRequests(data);
      setPages(Math.ceil(data.length / itemsPerPage));
    };

    fetchRequests();
  }, [userType, user.id]);



  return (
    <>
      <div className="flex flex-col items-center justify-between w-full px-2 text-[12px] md:text-[14px]">
        {currentRequests.map((request) => (
          <RowTable
            key={request.request_id}
            id={request.request_id}
            createdAt={request.createdAt}
            status={request.status}
            deliveryDueDate={request.delivery_due_date}
            user={request.user?.name || "Desconocido"}
          />
        ))}
      </div>
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
            className={`flex items-center px-3 py-2 border-2 rounded-md hover:bg-gray-100 cursor-pointer ${currentPage === i + 1 ? "bg-gray-300" : ""}`}
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