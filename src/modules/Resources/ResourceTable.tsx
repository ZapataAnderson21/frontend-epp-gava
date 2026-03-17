import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { resourceApi } from "../../data/apiUrl";
import type { Resource } from "../../data/types";
import { useFetch } from "../../hooks";
import { EditButton } from "../../common/button";
import { useNavigate } from "react-router-dom";

export default function ResourceTable() {
  const { data: resources, loading, error } = useFetch<Resource[]>(resourceApi);

  const processedResources = resources?.map((res) => ({
    ...res,
    categoryName: res.categoryResource ? res.categoryResource.name : "Sin categoría",
  }));

  const navigate = useNavigate();

  const columns = [
    { key: "name", label: "Nombre", width: "12rem" },
    { key: "description", label: "Descripción", width: "20rem" },
    { key: "categoryName", label: "Categoría", width: "12rem" },
    { key: "unit", label: "Unidad", width: "8rem" },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: Resource) => {
        return <EditButton onClick={() => navigate(`/admin/resources/${row.resourceId}`)} />;
      }
    }
  ] as const;

  if (loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!resources || resources.length === 0) {
    return <div className="text-center text-gray-500 w-full">No hay recursos disponibles.</div>;
  }

  return (
    <Table<Resource>
      data={processedResources || []}
      columns={columns}
    />
  );
}