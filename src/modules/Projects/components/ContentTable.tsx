import RowTable from "./RowTable";
import { fetchGetAllProjects, fetchGetByStatus, type ProjectType } from "../../../data/projectData";
import { useEffect, useState } from "react";
import LoadingSkeletonTable from "../../../common/LoadingSkeletonTable";
import HeaderTable from "./HeaderTable";

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

      if (responseData.statusCode === 200) {
        setProjects(responseData.data);
        setLoading(false);
        setError("");
      } else {
        setError(responseData.message);
        setLoading(false);
        setProjects([]);
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