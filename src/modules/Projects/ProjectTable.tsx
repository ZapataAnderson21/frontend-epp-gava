import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { projectApi } from "../../data/apiUrl";
import { type ProjectType } from "../../data/types";
import { useFetch } from "../../hooks";

interface ProjectTableProps {
  filter: string;
}

export default function ProjectTable({ filter }: ProjectTableProps) {

  const { data: projects, loading, error } = useFetch<ProjectType[]>(projectApi + (filter !== "all" ? `status/${filter}` : ""), [filter]);

  const columns = [
    { key: "project_id", label: "Id", width: "4rem" },
    { key: "name", label: "Nombre", width: "12rem" },
    { key: "code", label: "Código", width: "12rem" },
    { key: "status", label: "Estado", width: "12rem" },
    { key: "createdAt", label: "Fecha de Registro", width: "12rem" },
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
    <Table<ProjectType>
      data={processedProjects}
      columns={columns}
      getHref={(p) => `/admin/projects/${p.project_id}`}
    />
  );
}
