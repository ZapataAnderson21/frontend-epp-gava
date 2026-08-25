import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useMemo } from "react";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { emergencyApi } from "../../data/apiUrl";
import type { EmergencyType } from "../../data/types";
import { useFetch } from "../../hooks";
import SeeButton from "../../common/button/SeeButton";
import { AddButton } from "../../common/button";

const labelStatus: Record<string, string> = {
  "pending" : "PENDIENTE",
  "addressed" : "ATENDIDA",
  "rejected" : "RECHAZADA"
};

const bgStatusColor: Record<string, string> = {
  "pending" : "#d97706", // amber-500
  "addressed" : "#228b22", // green
  "rejected" : "#c53030" // red-600
};

type StoredUser = { userId?: unknown; userType?: unknown; type?: unknown };

export default function EmergencyTable() {
  const [searchParams] = useSearchParams();
  const { id: routeProjectId } = useParams<{ id: string }>();

  // 1) Lee y normaliza el usuario (una sola vez)
  const stored = useMemo<StoredUser>(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  }, []);

  const role = String(stored.userType ?? stored.type ?? "").toUpperCase().trim();
  const isManager = role === "GERENTE" || role === "ADMINISTRADORA";

  // 2) projectId desde route params (/projects/:id/emergencies) o query params (?projectId=1)
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

  const navigate = useNavigate();

  const { data: emergencies, loading, error } =
    useFetch<EmergencyType[]>(urlFetch, [urlFetch]);

  const columns = [
    { key: "title", label: "Asunto", width: "12rem" },
    { key: "projectName", label: "Proyecto", width: "12rem" },
    {label: "Estado",
      width: "8rem",
      render: (row: EmergencyType) => {
        return (
          <span className={`px-2 py-1 rounded-full text-white font-semibold text-xs`}
                style={{ backgroundColor: bgStatusColor[row.status as keyof typeof bgStatusColor] || '#9ca3af' }}>
                  {labelStatus[row.status as keyof typeof labelStatus]}
          </span>
        );
      }
    },
    {
      "label": "Acciones",
      width: "8rem",
      render: (row: EmergencyType) => {
        return <SeeButton onClick={() => navigate(`/admin/emergencies/${row.emergencyId}`, { state: { fromProject: projectId } })} />;
      }
    }
  ] as const;

  const navigateToNewProject = () => {
    if (projectId) {
      navigate(`/admin/emergencies/new?projectId=${projectId}`);
    } else {
      navigate(`/admin/emergencies/new`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col max-w-full w-full gap-6">
        <div className="flex w-full justify-end">
          <div className="w-fit">
            <AddButton onClick={navigateToNewProject} />
          </div>
        </div>
        <LoadingSkeletonTable />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col max-w-full w-full gap-6">
        <div className="flex w-full justify-end">
          <div className="w-fit">
            <AddButton onClick={navigateToNewProject} />
          </div>
        </div>
        <ErrorMessage errorMessage={error} />
      </div>
    );
  }

  if (!emergencies?.length) {
    return (
      <div className="flex flex-col max-w-full w-full gap-6">
        <div className="flex w-full justify-end">
          <div className="w-fit">
            <AddButton onClick={navigateToNewProject} />
          </div>
        </div>
        <div className="text-gray-500">No hay emergencias disponibles.</div>
      </div>
    );
  }

  const processedEmergencies = emergencies.map((e) => ({
    ...e,
    projectName: e.project?.name ?? "Sin proyecto",
    userName: e.user?.name ?? "Sin responsable",
  }));

  return (
    <div className="flex flex-col max-w-full w-full gap-6">
      <div className="flex w-full justify-end">
        <div className="w-fit">
          <AddButton onClick={navigateToNewProject} />
        </div>
      </div>
      <Table<EmergencyType>
        data={processedEmergencies}
        columns={columns}
      />  
    </div>
  );
}
