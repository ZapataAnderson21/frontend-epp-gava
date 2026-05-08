import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FaCheck } from "react-icons/fa6";
import { ReturnButton } from "../../../../../common/button";
import { Button } from "../../../../../components";
import { inventoryApi, projectApi } from "../../../../../data/apiUrl";
import type { ProjectInventoryEntry } from "../../../../../data/types";
import getAuthHeaders from "../../../../../hooks/getAuthHeaders";
import { useApiAction } from "../../../../../hooks";

interface HeaderActionsProps {
  projectId: number;
}

type ApiResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
};

const getEntryIds = (entry: ProjectInventoryEntry) =>
  entry.projectInventoryEntryIds?.length
    ? entry.projectInventoryEntryIds
    : [entry.projectInventoryEntryId];

export default function HeaderActions({ projectId }: HeaderActionsProps) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const { execute: updateProjectStatus, loading: finishing } =
    useApiAction<unknown>();

  const fetchReturnBlockers = async () => {
    const response = await fetch(
      `${inventoryApi}project/${projectId}/inactivation-blockers`,
      { headers: getAuthHeaders() },
    );
    const payload = (await response.json()) as ApiResponse<
      ProjectInventoryEntry[]
    >;

    if (!response.ok || payload.statusCode >= 300) {
      throw new Error(
        payload.message || "No se pudo verificar el inventario del proyecto.",
      );
    }

    return payload.data || [];
  };

  const handleFinishProject = async () => {
    if (checking || finishing) return;

    let blockers: ProjectInventoryEntry[] = [];

    try {
      setChecking(true);
      blockers = await fetchReturnBlockers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo validar el cierre del proyecto.",
      );
      return;
    } finally {
      setChecking(false);
    }

    if (blockers.length) {
      const blockerIds = blockers.flatMap(getEntryIds);
      sessionStorage.setItem(
        `project-return-blockers:${projectId}`,
        JSON.stringify({
          blockerIds,
          blockers,
          createdAt: Date.now(),
        }),
      );
      navigate(`/admin/projects/${projectId}/inventory`, {
        state: {
          showReturnBlockers: true,
          blockerIds,
          blockers,
        },
      });
      return;
    }

    await toast.promise(
      updateProjectStatus(`${projectApi}${projectId}/status`, "PATCH", {
        status: "inactive",
      }),
      {
        loading: "Finalizando proyecto...",
        success: "Proyecto finalizado correctamente.",
        error: (error) => error.message || "No se pudo finalizar el proyecto.",
      },
    );
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-row gap-2">
        <ReturnButton onClick={() => navigate("/admin/projects")} />
        <Button
          icon={<FaCheck />}
          label={checking || finishing ? "Validando..." : "Finalizar"}
          onClick={handleFinishProject}
          bgColor="#16a34a"
          bgHoverColor="#15803d"
          type="button"
          disabled={checking || finishing}
        />
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
