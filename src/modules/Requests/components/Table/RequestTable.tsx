import { Table } from "../../../../common/table";
import type { RequestType } from "../../../../data/types";

export default function RequestTable({ requests }: { requests: RequestType[] }) {
  
  const processedRequests = requests.map(request => ({
    ...request,
    userName: request.user?.name
  }));
  
  const columns = [
    { key: "request_id", label: "Id", width: "w-16" },
    { key: "createdAt", label: "FyH de Reg", width: "w-36" },
    { key: "userName", label: "Solicitante", width: "w-36" },
    { key: "delivery_due_date", label: "FyH de Entr", width: "w-36" },
    { key: "status", label: "Estado", width: "w-36" },
  ] as const;

  return (
    <Table<RequestType>
      data={processedRequests}
      columns={columns}
      getHref={(p) => `/admin/requests/${p.request_id}`}
    />
  );
}
