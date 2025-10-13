import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { emergencyApi } from "../../data/apiUrl";
import type { EmergencyType } from "../../data/types";
import { useFetch } from "../../hooks";

type StoredUser = { userId?: unknown; userType?: unknown; type?: unknown };

export default function EmergencyTable() {
  const [searchParams] = useSearchParams();

  // 1) Lee y normaliza el usuario (una sola vez)
  const stored = useMemo<StoredUser>(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  }, []);

  const role = String(stored.userType ?? stored.type ?? "").toUpperCase().trim();
  const isManager = role === "GERENTE" || role === "ADMINISTRADORA";

  // 2) projectId desde la URL (opcional)
  const projectId = useMemo(() => {
    const v = searchParams.get("projectId");
    const n = v ? Number(v) : undefined;
    return Number.isFinite(n!) ? n : undefined;
  }, [searchParams]);

  // 3) userId efectivo: solo si NO es gerente/administradora
  const effectiveUserId = useMemo(() => {
    const n = Number(stored.userId);
    return !isManager && Number.isFinite(n) && n > 0 ? n : undefined;
  }, [isManager, stored.userId]);

  // 4) Construir la URL con query params
  const urlFetch = useMemo(() => {
    const params = new URLSearchParams();
    if (projectId) params.set("projectId", String(projectId));
    if (effectiveUserId !== undefined) params.set("userId", String(effectiveUserId));
    const qs = params.toString();
    return qs ? `${emergencyApi}?${qs}` : emergencyApi;
  }, [projectId, effectiveUserId]);

  // (Opcional) debug
  // useEffect(() => console.log("Emergency URL:", urlFetch), [urlFetch]);

  const { data: emergencies, loading, error } =
    useFetch<EmergencyType[]>(urlFetch, [urlFetch]);

  const columns = [
    { key: "emergencyId", label: "Id", width: "4rem" },
    { key: "title", label: "Asunto", width: "12rem" },
    { key: "projectName", label: "Proyecto", width: "12rem" },
    { key: "userName", label: "Responsable", width: "12rem" },
  ] as const;

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (!emergencies?.length) return <div className="text-gray-500">No hay emergencias disponibles.</div>;

  const processedEmergencies = emergencies.map((e) => ({
    ...e,
    projectName: e.project?.name ?? "Sin proyecto",
    userName: e.user?.name ?? "Sin responsable",
  }));

  return (
    <Table<EmergencyType>
      data={processedEmergencies}
      columns={columns}
      getHref={(e) => `/admin/emergencies/${e.emergencyId}`}
    />
  );
}
