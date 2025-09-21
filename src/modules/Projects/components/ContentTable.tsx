import RowTable from "./RowTable";
import { fetchGetAllProjects, fetchGetByStatus, type ProjectType } from "../../../data/projectData";
import { useEffect, useState } from "react";
import LoadingSkeletonTable from "../../../common/LoadingSkeletonTable";

interface ContentTableProps {
  filter: string;
}

export default function ContentTable({ filter }: ContentTableProps) {

  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      let response;
      if (filter === "all") {
        response = await fetchGetAllProjects();
      } else {
        response = await fetchGetByStatus(filter);
      }

      let responseData;
      if (response instanceof Response) {
        responseData = await response.json();
      } else {
        responseData = response;
      }

      switch (responseData.statusCode) {
        case 200:
          setProjects(responseData.data);
          setLoading(false);
          setError(null);
          break;
        default:
          setError(responseData.message);
          setLoading(false);
          setProjects([]);
          break;
      }
    };

    fetchProjects();
  }, [filter]);

  if (loading) {
    return (
      <div className="w-full">
        <LoadingSkeletonTable />
      </div>
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
    <div className="flex flex-col items-center justify-between w-full px-2 text-[12px] md:text-[14px]">
      {projects.map((project) => (
        <RowTable key={project.project_id} id={project.project_id} name={project.name} code={project.code} status={project.status} />
      ))}
    </div>
  );
}