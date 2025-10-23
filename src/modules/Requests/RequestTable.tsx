import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { requestApi } from "../../data/apiUrl";
import type { RequestType } from "../../data/types";
import { useFetch } from "../../hooks";
import { useMemo, useEffect } from "react";
import { FaPencil } from "react-icons/fa6";
import { motion } from "framer-motion";
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

  // Lee y normaliza desde localStorage
  const stored = useMemo<StoredUser>(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  }, []);

  const role = String(stored.userType ?? stored.type ?? "").toUpperCase().trim();
  const isManager = role === "GERENTE" || role === "ADMINISTRADORA";

  const effectiveUserId = useMemo(() => {
    const idNum = Number(stored.userId);
    return !isManager && Number.isFinite(idNum) && idNum > 0 ? idNum : undefined;
  }, [isManager, stored.userId]);

  const projectId = useMemo(() => {
    const v = searchParams.get("projectId");
    const n = v ? Number(v) : undefined;
    return Number.isFinite(n!) ? n : undefined;
  }, [searchParams]);

  const urlFetch = useMemo(() => {
    const params = new URLSearchParams();
    if (filter && filter !== "all") params.set("status", filter);
    if (projectId) params.set("projectId", String(projectId));
    if (effectiveUserId !== undefined) params.set("userId", String(effectiveUserId));
    const qs = params.toString();
    return qs ? `${requestApi}?${qs}` : requestApi;
  }, [filter, projectId, effectiveUserId]);

  const { data: requests, loading, error } = useFetch<RequestType[]>(urlFetch, [urlFetch]);

  useEffect(() => {
    console.log("role:", role, "isManager:", isManager, "effectiveUserId:", effectiveUserId);
    console.log("Fetch URL:", urlFetch);
    console.log("Requests:", requests);
  }, [role, isManager, effectiveUserId, urlFetch, requests]);

  const navigate = useNavigate();

  const navigateToRequest = (requestId: number) => {
    navigate(`/admin/requests/${requestId}`);
  }

  const navigateToEditRequest = (requestId: number) => {
    navigate(`/admin/requests/edit/${requestId}`);
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
