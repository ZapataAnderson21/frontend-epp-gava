import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EditButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { resourceApi } from "../../data/apiUrl";
import type { Resource } from "../../data/types";
import { useFetch } from "../../hooks";

export default function ResourceTable() {
  const { data: resources, loading, error } = useFetch<Resource[]>(resourceApi);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const processedResources = useMemo(
    () =>
      (resources ?? []).map((resource) => ({
        ...resource,
        categoryName: resource.categoryResource
          ? resource.categoryResource.name
          : "Sin categoría",
      })),
    [resources],
  );

  const filteredResources = useMemo(() => {
    const query = normalizeText(search);
    if (!query) return processedResources;

    return processedResources.filter((resource) =>
      normalizeText(
        [
          resource.name,
          resource.description,
          resource.categoryName,
          resource.unit,
        ].join(" "),
      ).includes(query),
    );
  }, [processedResources, search]);

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

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;

  if (!resources || resources.length === 0) {
    return <div className="w-full text-center text-gray-500">No hay recursos disponibles.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por nombre, descripción, categoría o unidad"
        aria-label="Buscar recursos"
        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold outline-none focus:border-[#0047a3] md:max-w-lg"
      />

      {filteredResources.length ? (
        <Table<Resource> data={filteredResources} columns={columns} />
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No hay recursos que coincidan con la búsqueda.
        </div>
      )}
    </div>
  );
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
