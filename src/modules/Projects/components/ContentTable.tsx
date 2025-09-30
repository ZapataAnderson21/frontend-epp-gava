import RowTable from "./RowTable";
import { type ProjectType } from "../../../data/types";
import LoadingSkeletonTable from "../../../common/LoadingSkeletonTable";
import HeaderTable from "./HeaderTable";
import { projectApi } from "../../../data/apiUrl";
import { useFetch } from "../../../hooks/useFetch";
import ErrorMessage from "../../../common/ErrorMessage";

interface ContentTableProps {
  filter: string;
}

export default function ContentTable({ filter }: ContentTableProps) {
  const url = filter === "all" ? projectApi : `${projectApi}status/${filter}`;

  const { data: projects, loading, error } = useFetch<ProjectType[]>(url, [filter]);

  if (loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return (
      <ErrorMessage errorMessage={error} />
    );
  }

  if (!projects) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-between min-w-full">
      <HeaderTable />
      {projects.map((project, index) => (
        <RowTable
          key={project.project_id}
          order={index + 1}
          id={project.project_id}
          name={project.name}
          code={project.code}
          createdAt={project.createdAt}
          status={project.status}
        />
      ))}
    </div>
  );
}
