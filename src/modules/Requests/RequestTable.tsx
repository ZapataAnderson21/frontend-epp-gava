import { useSearchParams } from "react-router-dom";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { requestApi } from "../../data/apiUrl";
import type { RequestType } from "../../data/types";
import { useFetch } from "../../hooks";
import { useMemo, useEffect } from "react";

interface RequestTableProps {
  filter: string;
}

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

  // Debug opcional para verificar que no se mande userId en GERENTE/ADMINISTRADORA
  useEffect(() => {
    console.log("role:", role, "isManager:", isManager, "effectiveUserId:", effectiveUserId);
    console.log("Fetch URL:", urlFetch);
  }, [role, isManager, effectiveUserId, urlFetch]);

  const { data: requests, loading, error } = useFetch<RequestType[]>(urlFetch, [urlFetch]);

  const columns = [
    { key: "requestId", label: "Id", width: "4rem" },
    { key: "createdAt", label: "F y H de Registro", width: "9rem" },
    { key: "userName", label: "Solicitante", width: "9rem" },
    { key: "deliveryDueDate", label: "F y H de Entrega", width: "9rem" },
    { key: "status", label: "Estado", width: "9rem" },
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
      getHref={(p) => `/admin/requests/${p.requestId}`}
    />
  );
}
