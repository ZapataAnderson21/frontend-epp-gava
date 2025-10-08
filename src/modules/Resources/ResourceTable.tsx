import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { resourceApi } from "../../data/apiUrl";
import type { Resource } from "../../data/types";
import { useFetch } from "../../hooks";

export default function ResourceTable() {
  const { data: resources, loading, error } = useFetch<Resource[]>(resourceApi);

  const processedResources = resources?.map((res) => ({
    ...res,
    categoryName: res.categoryResource ? res.categoryResource.name : "Sin categoría",
  }));

  const columns = [
    { key: "name", label: "Nombre", width: "12rem" },
    { key: "description", label: "Descripción", width: "20rem" },
    { key: "categoryName", label: "Categoría", width: "12rem" },
    { key: "unit", label: "Unidad", width: "8rem" },
  ] as const;

  if (loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!resources || resources.length === 0) {
    return <div className="text-center text-gray-500">No hay recursos disponibles.</div>;
  }

  return (
    <Table<Resource>
      data={processedResources || []}
      columns={columns} 
      getHref={(resource) => `/admin/resources/${resource.resourceId}`}
    />
  );
}