import { useState } from "react";
import RowTable from "./RowTable";
import { fetchGetRequestsByUser, fetchGetAllRequests, type RequestType, type RequestGetAllResponse } from "../../../data/requestData";
import { useEffect } from "react";

export default function ContentTable() {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userType = user.userUserTypes[0].userType.name;

  const [requests, setRequests] = useState<RequestType[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      let data: RequestType[] = [];

      if (
        ["ADMINISTRADORA", "LOGISTICA", "GERENTE"].includes(userType)
      ) {
        const response = await fetchGetAllRequests() as RequestGetAllResponse;

        console.log("Original data:", response.data);

        const filteredData = response.data.filter(
          (req: RequestType) => (req.status ?? "").trim().toLowerCase() !== "draft"
        );

        console.log("Filtered data:", filteredData);

        data = filteredData.reverse();
      } else {
        const response = await fetchGetRequestsByUser(user.user_id) as RequestGetAllResponse;
        data = response.data;
      }

      setRequests(data.reverse());
    };

    fetchRequests();
  }, [userType, user.id]);


  return (
    <div className="flex flex-col items-center justify-between w-full px-2 text-[12px] md:text-[14px]">
      {requests.map((request) => (
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
  );
}