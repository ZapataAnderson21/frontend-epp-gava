import RowTable from "./RowTable";
import { fetchGetAllProjects, fetchGetByStatus, type ProjectType } from "../../../data/projectData";
import { useEffect, useState } from "react";

interface ContentTableProps {
  filter: string;
}

export default function ContentTable({ filter }: ContentTableProps) {

  const [projects, setProjects] = useState<ProjectType[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      let response;
      if (filter === "all") {
        response = await fetchGetAllProjects();
      } else {
        response = await fetchGetByStatus(filter);
      }

      if (response.statusCode === 200) {
        setProjects(response.data);
      }
    };

    fetchProjects();
  }, [filter]);


  return (
    <div className="flex flex-col items-center justify-between w-full px-2 text-[12px] md:text-[14px]">
      {projects.map((project) => (
        <RowTable key={project.project_id} id={project.project_id} name={project.name} code={project.code} status={project.status} />
      ))}
    </div>
  );
}