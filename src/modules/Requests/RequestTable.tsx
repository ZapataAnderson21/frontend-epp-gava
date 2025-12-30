import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { requestApi } from "../../data/apiUrl";
import type { RequestType } from "../../data/types";
import { useFetch } from "../../hooks";
import { useMemo, useEffect } from "react";
import SeeButton from "../../common/button/SeeButton";
import { EditButton } from "../../common/button";
import StatusTag from "./components/StatusTag";

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

  const role = String(stored.userType ?? stored.type ?? "").toUpperCase().trim();
  const isManager = role === "GERENTE" || role === "ADMINISTRADORA";
  const myUserId = Number(stored.userId);

  const effectiveUserId = useMemo(() => {
    const idNum = Number(stored.userId);
    return !isManager && Number.isFinite(idNum) && idNum > 0 ? idNum : undefined;
  }, [isManager, stored.userId]);

  const urlFetch = useMemo(() => {
    const params = new URLSearchParams();

    if (filter && filter !== "all") params.set("status", filter);
    if (projectId) params.set("projectId", String(projectId));

    // Usuarios normales: filtra por su userId
    if (!isManager && Number.isFinite(myUserId)) {
      params.set("userId", String(myUserId));
    }

    // SIEMPRE pasar viewerId (clave para ocultar borradores ajenos en el backend)
    if (Number.isFinite(myUserId)) {
      params.set("viewerId", String(myUserId));
    }

    const qs = params.toString();
    return qs ? `${requestApi}?${qs}` : requestApi;
    // 👇 DEPENDENCIAS REALES USADAS ADENTRO
  }, [filter, projectId, isManager, myUserId]);


  const { data: requests, loading, error } = useFetch<RequestType[]>(urlFetch, [urlFetch]);

  useEffect(() => {
    console.log("role:", role, "isManager:", isManager, "effectiveUserId:", effectiveUserId);
    console.log("Fetch URL:", urlFetch);
    console.log("Requests:", requests);
  }, [role, isManager, effectiveUserId, urlFetch, requests]);

  const navigate = useNavigate();

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

  const columns = [
    { key: "requestId", label: "Id", width: "4rem" },
    { key: "createdAt", label: "F y H de Registro", width: "8rem" },
    { key: "userName", label: "Solicitante", width: "8rem" },
    { key: "deliveryDueDate", label: "F y H de Entrega", width: "8rem" },
    { 
      label: "Estado",
      width: "8rem",
      render: (row: RequestType) => {
        return <StatusTag status={row.status} />
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
    <Table<RequestType>
      data={processedRequests}
      columns={columns}
    />
  );
}
