import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AddButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { HeaderPanel, Panel } from "../../common/panel";
import { elementApi } from "../../data/apiUrl";
import type { ElementType } from "../../data/types";
import { useFetch } from "../../hooks";
import ElementTable from "./ElementTable";
import {
  getInventoryCatalogTabFromSource,
  getInventoryFamilyConfig,
  inventoryFamilyTabs,
  resolveInventoryRouteFamily,
} from "./inventoryCatalog";

export default function Elements() {
  const { family, type } = useParams<{ family?: string; type?: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const routeFamily = resolveInventoryRouteFamily(family ?? type);
  const isLegacyRoute = Boolean(type);
  const activeFamily = routeFamily;

  const {
    data: elements,
    loading,
    error,
  } = useFetch<ElementType[]>(elementApi, []);

  const familyCounts = useMemo(() => {
    const counts = inventoryFamilyTabs.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = 0;
      return acc;
    }, {});

    (elements || []).forEach((element) => {
      const familyKey = getInventoryCatalogTabFromSource(element);
      counts[familyKey] = (counts[familyKey] || 0) + 1;
      counts.all = (counts.all || 0) + 1;
    });

    return counts;
  }, [elements]);

  const filteredElements = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (elements || []).filter((element) => {
      const familyKey = getInventoryCatalogTabFromSource(element);
      const matchesFamily = activeFamily === "all" || familyKey === activeFamily;
      const matchesSearch = !normalizedSearch
        || [
          element.name,
          element.code || "",
          element.categoryName || "",
          element.description || "",
          getInventoryFamilyConfig(familyKey)?.label || "",
          element.typeLabel || element.type,
          element.controlTypeLabel || element.controlType || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesFamily && matchesSearch;
    });
  }, [activeFamily, elements, searchTerm]);

  const nextFamily = activeFamily === "all" || activeFamily === "operative" ? "epp" : activeFamily;
  const canCreateNewElement = activeFamily !== "operative";

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <Panel>
      <HeaderPanel name="Inventario">
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-end">
          <div className="w-full max-w-xs">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
              placeholder="Buscar por nombre, codigo, categoria o familia"
            />
          </div>
          {canCreateNewElement ? (
            <AddButton onClick={() => navigate(`/admin/elements/new?family=${nextFamily}`)} />
          ) : null}
        </div>
      </HeaderPanel>

      <div className="flex w-full flex-col gap-4">
        <p className="max-w-4xl text-sm text-gray-500">
          Inventario de elementos SSOMA y equipos de calidad. ESE y EM requieren codigo,
          EPI se entrega manualmente a los trabajadores y los registros heredados siguen
          visibles para no perder trazabilidad.
        </p>

        {activeFamily === "operative" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Este tab agrupa los elementos legacy con tipo <span className="font-semibold">Operative</span>.
            Usalo para revisarlos y asignarles una familia definitiva sin perder su historial.
          </div>
        ) : null}

        {isLegacyRoute ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Esta ruta es heredada. Los registros operativos antiguos se muestran bajo la
            clasificacion actual para conservar el historial.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {inventoryFamilyTabs.map((tab) => {
            const active = activeFamily === tab.key;
            const count = familyCounts[tab.key] || 0;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => navigate(tab.key === "all" ? "/admin/inventory" : `/admin/inventory/${tab.key}`)}
                className={`rounded-t-md border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "border-[#0047a3] text-[#0047a3]"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {!filteredElements.length ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            {(elements || []).length
              ? "No hay elementos que coincidan con la busqueda o la familia seleccionada."
              : "Todavia no hay elementos cargados en inventario."}
          </div>
        ) : (
          <ElementTable elements={filteredElements} />
        )}
      </div>
    </Panel>
  );
}
