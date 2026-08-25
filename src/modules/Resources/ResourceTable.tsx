import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EditButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { resourceApi } from "../../data/apiUrl";
import type { Resource } from "../../data/types";
import { useDebouncedValue, usePaginatedFetch } from "../../hooks";

export default function ResourceTable() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const {
    items: resources,
    pagination,
    loading,
    error,
    setPage,
    setPageSize,
  } = usePaginatedFetch<Resource>(`${resourceApi}paginated`, {
    params: { search: debouncedSearch },
  });
  const navigate = useNavigate();

  const processedResources = useMemo(
    () =>
      resources.map((resource) => ({
        ...resource,
        categoryName: resource.categoryResource
          ? resource.categoryResource.name
          : "Sin categoría",
      })),
    [resources],
  );

  const columns = [
    { key: "name", label: "Nombre", width: "12rem" },
    { key: "description", label: "Descripción", width: "20rem" },
    { key: "categoryName", label: "Categoría", width: "12rem" },
    { key: "unit", label: "Unidad", width: "8rem" },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: Resource) => (
        <EditButton onClick={() => navigate(`/admin/resources/${row.resourceId}`)} />
      ),
    },
  ] as const;

  if (loading && !pagination) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;

  if (!resources.length && !search) {
    return <div className="w-full text-center text-gray-500">No hay recursos disponibles.</div>;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por nombre, descripción, categoría o unidad"
        aria-label="Buscar recursos"
        className="w-full rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold outline-none focus:border-[#0047a3] md:max-w-lg"
      />

      {processedResources.length ? (
        <Table<Resource>
          data={processedResources}
          columns={columns}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={loading}
          getRowKey={(row) => row.resourceId}
        />
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No hay recursos que coincidan con la búsqueda.
        </div>
      )}
    </div>
  );
}
