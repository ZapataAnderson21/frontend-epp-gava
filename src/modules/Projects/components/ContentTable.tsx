import RowTable from "./RowTable";
import { type ProjectType } from "../../../data/projectData";
import { useEffect, useState } from "react";
import LoadingSkeletonTable from "../../../common/LoadingSkeletonTable";
import HeaderTable from "./HeaderTable";
import { projectApi } from "../../../data/apiUrl";
import { getFetch } from "../../../hooks/useFetch";

interface ContentTableProps {
  filter: string;
}

export default function ContentTable({ filter }: ContentTableProps) {

  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  let count = 0;

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      let response;
      if (filter === "all") {
        response = await getFetch(projectApi);
      } else {
        response = await getFetch(projectApi + 'status/' + filter);
      }

      if (response.statusCode === 200) {
        setProjects(response.data);
        setLoading(false);
        setError("");
      } else {
        setError(response.message);
        setLoading(false);
        setProjects([]);
      }
    };

    fetchProjects();
  }, [filter]);

  if (loading) {
    return (
      <LoadingSkeletonTable />
    );
  }

  if (error) {
    return(
      <div className="flex items-center justify-center w-full h-full">
       {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between min-w-full">
      <HeaderTable />
      {projects.map((project) => {
        count = count + 1;
        return (
          <RowTable key={project.project_id} order={count} id={project.project_id} name={project.name} code={project.code} status={project.status} />
        );
      })}
    </div>
  );
}