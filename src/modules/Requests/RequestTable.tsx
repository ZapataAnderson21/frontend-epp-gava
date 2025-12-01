import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { requestApi } from "../../data/apiUrl";
import type { RequestType } from "../../data/types";
import { useFetch } from "../../hooks";
import { useMemo, useEffect } from "react";
import SeeButton from "../../common/button/SeeButton";
import { EditButton } from "../../common/button";

interface RequestTableProps {
  filter: string;
}

const bgStatusColor = {
  "Borrador": "#9ca3af", // gray-400
  "En progreso": "#d97706", // amber-600
  "Revisada": "#fbbf24", // yellow-600
  "Aprobada": "#4ade80", // green-500
  "Rechazada": "#ef4444", // red-500
  "Atendida": "#06b6d4", // cyan-500
  "Completada": "#3b82f6", // purple-500
};

type StoredUser = { userId?: unknown; userType?: unknown; type?: unknown };

export default function RequestTable({ filter }: RequestTableProps) {
  const [searchParams] = useSearchParams();
  const { id: routeProjectId } = useParams<{ id: string }>();

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

  // Captura projectId de route params (/projects/:id/requests) o query params (?projectId=1)
  const projectId = useMemo(() => {
    // Primero intenta desde route params
    if (routeProjectId) {
      const n = Number(routeProjectId);
      if (Number.isFinite(n) && n > 0) return n;
    }
    // Fallback a query params
    const v = searchParams.get("projectId");
    const n = v ? Number(v) : undefined;
    return Number.isFinite(n!) && n! > 0 ? n : undefined;
  }, [routeProjectId, searchParams]);

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
    // Si estamos en la página del proyecto, pasar el projectId en el state
    if (routeProjectId) {
      navigate(`/admin/requests/${requestId}`, { state: { fromProject: Number(routeProjectId) } });
    } else {
      navigate(`/admin/requests/${requestId}${projectId ? `?projectId=${projectId}` : ""}`);
    }
  }

  const navigateToEditRequest = (requestId: number) => {
    if (routeProjectId) {
      navigate(`/admin/requests/edit/${requestId}`, { state: { fromProject: Number(routeProjectId) } });
    } else {
      navigate(`/admin/requests/edit/${requestId}${projectId ? `?projectId=${projectId}` : ""}`);
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
        return (
        <span className={`px-2 py-1 rounded-full text-white font-semibold text-sm`} 
              style={{ backgroundColor: bgStatusColor[row.status as keyof typeof bgStatusColor] || '#9ca3af' }}>
                {row.status.toUpperCase()}
        </span>);
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
