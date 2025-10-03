import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { requestApi } from "../../data/apiUrl";
import type { RequestType } from "../../data/types";
import { useFetch } from "../../hooks";

interface RequestTableProps {
  filter: string;
}

export default function RequestTable({ filter }: RequestTableProps) {

  const { data: requests, loading, error } = useFetch<RequestType[]>(requestApi + `${filter === "all" ? "" : `status/${filter}`}`, [filter]);
  
  const columns = [
    { key: "request_id", label: "Id", width: "4rem" },
    { key: "createdAt", label: "FyH de Reg", width: "9rem" },
    { key: "userName", label: "Solicitante", width: "9rem" },
    { key: "delivery_due_date", label: "FyH de Entr", width: "9rem" },
    { key: "status", label: "Estado", width: "9rem" },
  ] as const;

  if(loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!requests || requests.length === 0) {
    return <div className="text-center text-gray-500">No hay requerimientos disponibles.</div>;
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const processedRequests = requests.map(request => ({
    ...request,
    userName: request.user?.name,
    createdAt: formatDateTime(request.createdAt),
    delivery_due_date: formatDateTime(request.delivery_due_date)
  }));

  return (
    <Table<RequestType>
      data={processedRequests}
      columns={columns}
      getHref={(p) => `/admin/requests/${p.request_id}`}
    />
  );
}
