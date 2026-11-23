import { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { AddButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { HeaderPanel, Panel } from "../../common/panel";
import DeleteConfirmDialog from "../../components/DeleteConfirmDialog";
import Select from "../../components/Select";
import { elementApi } from "../../data/apiUrl";
import type { ElementType } from "../../data/types";
import { useApiAction, useFetch } from "../../hooks";
import ElementTable from "./ElementTable";
import {
  inventoryPrimaryFamilies,
  ssomaPrimaryGroups,
  type InventoryFamilyTabKey,
} from "./inventoryCatalog";

type CatalogArea = "inventory" | "ssoma";
type SafetyControlFilter = "all" | "consumable" | "nonConsumable";

interface CatalogAreaPageProps {
  area: CatalogArea;
}

export default function CatalogAreaPage({ area }: CatalogAreaPageProps) {
  const navigate = useNavigate();
  const { family } = useParams<{ family?: string }>();
  const [search, setSearch] = useState("");
  const [safetyControl, setSafetyControl] =
    useState<SafetyControlFilter>("all");
  const [elementToDelete, setElementToDelete] = useState<ElementType | null>(
    null,
  );
  const [deletingElementId, setDeletingElementId] = useState<number | null>(
    null,
  );
  const {
    data: elements,
    loading,
    error,
    refetch,
  } = useFetch<ElementType[]>(elementApi, []);
  const { execute: deleteElement, loading: deleting } =
    useApiAction<ElementType>();

  const activeInventoryFamily = useMemo(() => {
    const requested = inventoryPrimaryFamilies.find(
      (item) => item.key === family,
    );
    return requested ?? inventoryPrimaryFamilies[0];
  }, [family]);

  const activeSsomaGroup = useMemo(() => {
    const requested = ssomaPrimaryGroups.find(
      (group) =>
        group.key === family ||
        group.families.includes(family as InventoryFamilyTabKey),
    );
    return requested ?? ssomaPrimaryGroups[0];
  }, [family]);

  const activeFamilies: readonly string[] = useMemo(
    () =>
      area === "inventory"
        ? [activeInventoryFamily.backendFamily]
        : activeSsomaGroup.families,
    [activeInventoryFamily.backendFamily, activeSsomaGroup.families, area],
  );
  const defaultFamily =
    area === "inventory"
      ? activeInventoryFamily.key
      : activeSsomaGroup.defaultFamily;
  const activeLabel =
    area === "inventory" ? activeInventoryFamily.label : activeSsomaGroup.label;
  const activeDescription =
    area === "inventory"
      ? activeInventoryFamily.description
      : activeSsomaGroup.description;
  const isSafetyGroup = area === "ssoma" && activeSsomaGroup.key === "safety";

  const filteredElements = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return (elements || []).filter((element) => {
      if (!activeFamilies.includes(element.family as InventoryFamilyTabKey)) {
        return false;
      }

      if (isSafetyGroup && safetyControl !== "all") {
        const isConsumable = element.controlType === "consumable";
        if (safetyControl === "consumable" && !isConsumable) return false;
        if (safetyControl === "nonConsumable" && isConsumable) return false;
      }

      if (!normalized) return true;
      return [
        element.name,
        element.code || "",
        element.categoryName || "",
        element.description || "",
        element.brand || "",
        element.model || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [activeFamilies, elements, isSafetyGroup, safetyControl, search]);

  const handleDelete = () => {
    if (!elementToDelete) return;
    setDeletingElementId(elementToDelete.elementId);
    toast.promise(
      deleteElement(`${elementApi}${elementToDelete.elementId}`, "DELETE"),
      {
        loading: "Archivando recurso...",
        success: (result) => {
          setElementToDelete(null);
          setDeletingElementId(null);
          refetch();
          return result.message || "Recurso archivado correctamente.";
        },
        error: (caught) => {
          setDeletingElementId(null);
          return caught instanceof Error
            ? caught.message
            : "No se pudo archivar el recurso.";
        },
      },
    );
  };

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;

  const tabs =
    area === "inventory"
      ? inventoryPrimaryFamilies.map((item) => ({
          key: item.key,
          label: item.label,
        }))
      : ssomaPrimaryGroups.map((group) => ({
          key: group.key,
          label: group.label,
        }));

  return (
    <Panel>
      <Toaster position="top-center" reverseOrder={false} />
      <HeaderPanel
        name={area === "inventory" ? "Inventario" : "Recursos SSOMA"}
      />

      <main className="flex w-full min-w-0 flex-col gap-5">
        <p className="max-w-3xl text-sm text-gray-500">
          {area === "inventory"
            ? "Catálogo operativo de equipos, herramientas, escaleras, materiales y arneses eléctricos."
            : "Catálogo de ropa de trabajo, EPP y equipos de seguridad."}
        </p>

        <nav
          className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2"
          aria-label={
            area === "inventory"
              ? "Categorías de inventario"
              : "Familias de Recursos SSOMA"
          }
        >
          {tabs.map((tab) => {
            const active =
              tab.key ===
              (area === "inventory"
                ? activeInventoryFamily.key
                : activeSsomaGroup.key);
            return (
              <button
                key={tab.key}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() =>
                  navigate(
                    area === "inventory"
                      ? `/admin/inventory/${tab.key}`
                      : `/admin/ssoma-resources/${tab.key}`,
                  )
                }
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition-colors motion-reduce:transition-none ${
                  active
                    ? "bg-[#0047a3] text-white"
                    : "text-gray-600 hover:bg-[#0047a3]/10 hover:text-[#0047a3]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <section className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                {activeLabel}
              </h2>
              <p className="mt-1 text-xs text-gray-500">{activeDescription}</p>
            </div>
            <AddButton
              label="Nuevo recurso"
              permission="inventory.manage"
              onClick={() =>
                navigate(
                  `/admin/elements/new?family=${defaultFamily}&area=${area}`,
                )
              }
            />
          </header>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex w-full max-w-md flex-col gap-1 text-xs font-bold text-gray-700">
              Buscar
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre, código, categoría, marca o modelo"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0047a3]"
              />
            </label>
            {isSafetyGroup ? (
              <label className="flex w-full max-w-xs flex-col gap-1 text-xs font-bold text-gray-700">
                Tipo de control
                <Select<SafetyControlFilter>
                  name="safetyControl"
                  value={safetyControl}
                  onChange={setSafetyControl}
                  options={[
                    { value: "all", label: "Todos" },
                    { value: "consumable", label: "Consumibles" },
                    { value: "nonConsumable", label: "No consumibles" },
                  ]}
                />
              </label>
            ) : null}
          </div>

          {filteredElements.length ? (
            <ElementTable
              elements={filteredElements}
              deletingElementId={deletingElementId}
              onDelete={setElementToDelete}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500">
              No hay recursos que coincidan con esta categoría y búsqueda.
            </div>
          )}
        </section>

        <p className="text-xs text-gray-500">
          Los registros históricos sin clasificación inequívoca permanecen en el{" "}
          <button
            type="button"
            className="font-bold text-[#0047a3] hover:underline"
            onClick={() => navigate("/admin/elements")}
          >
            catálogo legacy
          </button>
          .
        </p>
      </main>

      <DeleteConfirmDialog
        isOpen={Boolean(elementToDelete)}
        title="Archivar recurso"
        message={`Se archivará "${elementToDelete?.name || "este recurso"}" mediante eliminación lógica. Sus movimientos y relaciones históricas se conservarán.`}
        confirmText="Archivar"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setElementToDelete(null)}
      />
    </Panel>
  );
}
