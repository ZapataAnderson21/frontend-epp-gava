import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { requestApi } from "../../data/apiUrl";
import type { RequestType } from "../../data/types";
import { useFetch } from "../../hooks";
import { useMemo } from "react";
import SeeButton from "../../common/button/SeeButton";
import { EditButton } from "../../common/button";
import StatusTag, { type RequestStatusValue } from "./components/StatusTag";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useApiAction } from "../../hooks/useApiAction";
import toast, { Toaster } from "react-hot-toast";

interface RequestTableProps {
  filter: string;
  projectId?: number;
}

type StoredUser = { userId?: unknown; userType?: unknown; type?: unknown };

export default function RequestTable({ filter, projectId }: RequestTableProps) {
  // Lee y normaliza desde localStorage
  const stored = useMemo<StoredUser>(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  }, []);

  const myUserId = Number(stored.userId);

  const urlFetch = useMemo(() => {
    const params = new URLSearchParams();

    if (filter && filter !== "all") params.set("status", filter);
    if (projectId) params.set("projectId", String(projectId));

    // The backend uses viewerId only to keep drafts private.
    if (Number.isFinite(myUserId)) {
      params.set("viewerId", String(myUserId));
    }

    const qs = params.toString();
    return qs ? `${requestApi}?${qs}` : requestApi;
    // 👇 DEPENDENCIAS REALES USADAS ADENTRO
  }, [filter, projectId, myUserId]);


  const { data: requests, loading, error, refetch } = useFetch<RequestType[]>(urlFetch, [urlFetch]);
  const { user } = useCurrentUser();
  const { execute: updateRequestStatus } = useApiAction<any>();

  const navigate = useNavigate();
  const canEditRequestStatus =
    user?.userType === "ADMINISTRADORA" || user?.userType === "GERENTE";

  const navigateToRequest = (requestId: number) => {
    if (projectId) {
      navigate(`/admin/requests/${requestId}`, { state: { fromProject: projectId } });
    } else {
      navigate(`/admin/requests/${requestId}`);
    }
  }

  const navigateToEditRequest = (requestId: number) => {
    if (projectId) {
      navigate(`/admin/requests/edit/${requestId}`, { state: { fromProject: projectId } });
    } else {
      navigate(`/admin/requests/edit/${requestId}`);
    }
  }

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
      render: (row: RequestType) => row.user?.name + " " + row.user?.lastName || "Desconocido"
    },
    { key: "deliveryDueDate", label: "F y H de Entrega", width: "8rem" },
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
     }
    },
    {
      label: "Acciones",
      width: "12rem",
      render: (row: RequestType) => {
        return (
          <div className="flex gap-2">
            {
              (row.status === "Borrador") ? 
                <EditButton onClick={() => navigateToEditRequest(row.requestId)} /> 
                : 
                <SeeButton onClick={() => navigateToRequest(row.requestId)} />
            }
          </div>
        );
      }
    }
  ] as const;

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (!requests?.length) return <div className="text-center text-gray-500">No hay requerimientos disponibles.</div>;

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
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
      />
      <Toaster position="top-center" />
    </>
  );
}
