import { Table } from "../../common/table";
import { type ProjectType } from "../../data/types";

export default function ProjectTable({ projects }: { projects: ProjectType[] }) {
  const columns = [
    { key: "project_id", label: "Id", width: "w-16" },
    { key: "name", label: "Nombre", width: "w-48" },
    { key: "code", label: "Código", width: "w-32" },
    { key: "status", label: "Estado", width: "w-32" },
    { key: "createdAt", label: "Creado en", width: "w-48" },
  ] as const;

  return (
    <Table<ProjectType>
      data={projects}
      columns={columns}
      getHref={(p) => `/admin/projects/${p.project_id}`}
    />
  );
}
