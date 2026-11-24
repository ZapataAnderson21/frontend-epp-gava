import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { EditButton } from "../../common/button";
import SeeButton from "../../common/button/SeeButton";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { requestApi } from "../../data/apiUrl";
import type { RequestType } from "../../data/types";
import usePaginatedFetch from "../../hooks/usePaginatedFetch";
import { useApiAction } from "../../hooks/useApiAction";
import { useAccess } from "../../permissions/AccessProvider";
import StatusTag, { type RequestStatusValue } from "./components/StatusTag";

interface RequestTableProps {
  filter: string;
  projectId?: number;
  requestKind?: string;
  search?: string;
}

export default function RequestTable({ filter, projectId, requestKind, search }: RequestTableProps) {
  const {
    items: requests,
    pagination,
    setPage,
    setPageSize,
    loading,
    error,
    refetch,
  } = usePaginatedFetch<RequestType>(`${requestApi}paginated`, {
    params: {
      status: filter !== "all" ? filter : undefined,
      projectId,
      ssomaRequestKind: requestKind || undefined,
      search: search?.trim() || undefined,
      order: "desc",
    },
    extraDeps: [filter, projectId, requestKind, search],
  });

  const { execute: updateRequestStatus } = useApiAction<unknown>();

  const navigate = useNavigate();
  const { can } = useAccess();
  const canEditRequestStatus =
    can("requests.review") || can("requests.approve") || can("requests.attend");

  const navigateToRequest = (requestId: number) => {
    if (projectId) {
      navigate(`/admin/requests/${requestId}`, {
        state: { fromProject: projectId },
      });
    } else {
      navigate(`/admin/requests/${requestId}`);
    }
  };

  const navigateToEditRequest = (requestId: number) => {
    if (projectId) {
      navigate(`/admin/requests/edit/${requestId}`, {
        state: { fromProject: projectId },
      });
    } else {
      navigate(`/admin/requests/edit/${requestId}`);
    }
  };

  const handleStatusChange = async (
    requestId: number,
    newStatus: RequestStatusValue,
  ) => {
    await toast.promise(
      updateRequestStatus(`${requestApi}${requestId}/status`, "PATCH", {
        status: newStatus,
      }).then((result) => {
        refetch();
        return result;
      }),
      {
        loading: "Actualizando estado...",
        success: (result) =>
          result.message || "Estado actualizado correctamente.",
        error: (err) => err.message || "No se pudo actualizar el estado.",
      },
    );
  };

  const columns = [
    { key: "requestId", label: "Id", width: "4rem" },
    { key: "createdAt", label: "F y H de Registro", width: "8rem" },
    {
      label: "Solicitante",
      width: "12rem",
      render: (row: RequestType) =>
        row.user?.name + " " + row.user?.lastName || "Desconocido",
    },
    { key: "deliveryDueDate", label: "F y H de Entrega", width: "8rem" },
    {
      label: "Tipo",
      width: "10rem",
      render: (row: RequestType) =>
        row.ssomaRequestKind === "projectStart"
          ? "Inicio de Obra"
          : row.ssomaRequestKind === "duringExecution"
            ? "Durante la Ejecución"
            : "Histórico",
    },
    {
      label: "Estado",
      width: "8rem",
      render: (row: RequestType) => {
        return (
          <StatusTag
            status={row.status}
            editable={canEditRequestStatus && row.status !== "Completada"}
            onStatusChange={(newStatus) =>
              handleStatusChange(row.requestId, newStatus)
            }
          />
        );
      },
    },
    {
      label: "Acciones",
      width: "12rem",
      render: (row: RequestType) => {
        return (
          <div className="flex gap-2">
            {row.status === "Borrador" ? (
              <EditButton
                onClick={() => navigateToEditRequest(row.requestId)}
              />
            ) : (
              <SeeButton onClick={() => navigateToRequest(row.requestId)} />
            )}
          </div>
        );
      },
    },
  ] as const;

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (!requests?.length)
    return (
      <div className="text-center text-gray-500">
        No hay requerimientos disponibles.
      </div>
    );

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const processedRequests = requests.map((r) => ({
    ...r,
    userName: r.user?.name,
    createdAt: formatDateTime(r.createdAt),
    deliveryDueDate: formatDateTime(r.deliveryDueDate),
  }));

  return (
    <>
      <Table<RequestType>
        data={processedRequests}
        columns={columns}
        pagination={pagination}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
      <Toaster position="top-center" />
    </>
  );
}
