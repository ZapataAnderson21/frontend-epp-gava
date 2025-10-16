import { useEffect, useState } from "react";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { projectApi } from "../../data/apiUrl";
import { type ProjectType } from "../../data/types";
import { useFetch } from "../../hooks";
import SeeButton from "../../common/SeeButton";
import { ButtonContainer } from "../../common/form";
import { FaPencil } from "react-icons/fa6";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface ProjectTableProps {
  filter: string;
}

export default function ProjectTable({ filter }: ProjectTableProps) {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [permission, setPermission] = useState(false);

  const { data: projects, loading, error } = useFetch<ProjectType[]>(projectApi + (filter !== "all" ? `status/${filter}` : ""), [filter]);

  const columns = [
    { key: "projectId", label: "Id", width: "4rem" },
    { key: "name", label: "Nombre", width: "12rem" },
    { key: "code", label: "Código", width: "12rem" },
    { key: "status", label: "Estado", width: "12rem" },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: ProjectType) => (
        <ButtonContainer>
          <SeeButton to={`/admin/projects/${row.projectId}`} />
          {
            permission &&
            <Link to={`/admin/projects/edit/${row.projectId}`} aria-label="Edit" title="Edit">
              <motion.button type="button" className={"cursor-pointer flex gap-2 justify-center items-center border p-3 rounded-xl border-gray-100 bg-amber-400 hover:bg-amber-400 text-white w-fit hover:scale-[105%] duration-300 disabled:opacity-60"}>
                <FaPencil />
              </motion.button>
            </Link>
          }
        </ButtonContainer>
      )
    },
  ] as const;

  useEffect(() => {
    if (!user) return;

    if (["GERENTE", "ADMINISTRADORA", "SISTEMAS"].includes(user.userType)) {
      setPermission(true);
    }
  }, [user]);

  if (!user) {
    return <div className="text-red-500">Iniciar sesión.</div>;
  }

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
      getHref={(project) => permission ? `/admin/projects/${project.projectId}` : "#"}
    />
  );
}
