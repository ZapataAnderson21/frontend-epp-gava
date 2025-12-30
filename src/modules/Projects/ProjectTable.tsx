import { useNavigate } from "react-router-dom";
import { useCurrentUser, useFetch } from "../../hooks";

import { LoadingSkeletonTable } from "../../common/loading";
import { SeeButton, EditButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { Table } from "../../common/table";

import { adminTypes } from "../../utils";
import { type Project } from "../../data/types";
import { projectApi } from "../../data/apiUrl";
import Permission from "../../common/auth/Permission";
import StatusTag from "./components/StatusTag";

interface ProjectTableProps {
  filter: string;
}

export const statusColor = {
  "Activo": "#228b22",
  "Inactivo": "#c53030"
}

export default function ProjectTable({ filter }: ProjectTableProps) {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const { data: projects, loading, error } = useFetch<Project[]>(projectApi + (filter !== "all" ? `status/${filter}` : ""), [filter]);

  const columns = [
    { key: "name", label: "Nombre", width: "12rem" },
    { key: "code", label: "Código", width: "12rem" },
    { 
      label: "Estado",
      width: "8rem",
      render: (row: Project) => {
        return (
          <StatusTag status={row.status} />
        );
      }
    },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: Project) => (
        <div className="flex gap-2">
          <SeeButton onClick={() => navigate(`/admin/projects/${row.projectId}`)} />
          <Permission user={user} allow={adminTypes}>
            <EditButton onClick={() => navigate(`/admin/projects/edit/${row.projectId}`)} />
          </Permission>
        </div>
      )
    },
  ] as const;

  if (loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!projects || projects.length === 0) {
    return <div className="text-center text-gray-500">No hay proyectos disponibles.</div>;
  }

  const processedProjects = projects?.map(project => ({
    ...project,
    createdAt: new Date(project.createdAt).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "numeric",
      day: "numeric"
    })
  }));

  return (
    <Table<Project>
      data={processedProjects}
      columns={columns}
    />
  );
}
