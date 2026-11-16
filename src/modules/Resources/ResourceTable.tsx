import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DeleteButton, EditButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { DeleteConfirmDialog } from "../../components";
import { resourceApi } from "../../data/apiUrl";
import type { Resource } from "../../data/types";
import { useApiAction, useDebouncedValue, usePaginatedFetch } from "../../hooks";
import toast from "react-hot-toast";

export default function ResourceTable() {
  const [search, setSearch] = useState("");
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const {
    items: resources,
    pagination,
    loading,
    error,
    refetch,
    setPage,
    setPageSize,
  } = usePaginatedFetch<Resource>(`${resourceApi}paginated`, {
    params: { search: debouncedSearch },
  });
  const { execute: deleteResource, loading: deleting } =
    useApiAction<Resource>();
  const navigate = useNavigate();

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;

    await toast.promise(
      deleteResource(`${resourceApi}${resourceToDelete.resourceId}`, "DELETE"),
      {
        loading: "Eliminando recurso...",
        success: (result) => {
          setResourceToDelete(null);
          refetch();
          return result.message || "Recurso eliminado exitosamente";
        },
        error: (error) =>
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el recurso",
      },
    );
  };

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
        <div className="flex items-center gap-2">
          <EditButton
            onClick={() => navigate(`/admin/resources/${row.resourceId}`)}
          />
          <DeleteButton
            onClick={() => setResourceToDelete(row)}
            disabled={deleting && resourceToDelete?.resourceId === row.resourceId}
          />
        </div>
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

      <DeleteConfirmDialog
        isOpen={Boolean(resourceToDelete)}
        message={`¿Deseas eliminar el recurso ${resourceToDelete?.name ?? "seleccionado"}?`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setResourceToDelete(null)}
      />
    </div>
  );
}
