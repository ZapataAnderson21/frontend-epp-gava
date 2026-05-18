import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AddButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { HeaderPanel, Panel } from "../../common/panel";
import { elementApi } from "../../data/apiUrl";
import type { ElementType, FallProtectionGroupType } from "../../data/types";
import { useFetch } from "../../hooks";
import ElementTable from "./ElementTable";
import {
  getInventoryCatalogTabFromSource,
  getInventoryFamilyConfig,
  inventoryFamilyTabs,
  type InventoryFamilyTabKey,
  resolveInventoryRouteFamily,
} from "./inventoryCatalog";

type InventoryMainTab =
  | "protection"
  | "safety"
  | "ssomaSupply"
  | "fall"
  | "office"
  | "quality"
  | "legacy";
type InventoryFilter = "all" | InventoryFamilyTabKey;
type EpaView = "groups" | "elements";

const mainTabs: { key: InventoryMainTab; label: string; title: string }[] = [
  {
    key: "protection",
    label: "Elem. Protecc. Personal",
    title: "Elementos de Proteccion Personal",
  },
  {
    key: "safety",
    label: "Eq. Seg. y Emerg.",
    title: "Equipamento de Seguridad y Emergencia",
  },
  {
    key: "ssomaSupply",
    label: "Insumos SSOMA",
    title: "Insumos SSOMA",
  },
  {
    key: "fall",
    label: "Eq. Protecc. Anticaida",
    title: "Equipo de Proteccion Anticaida",
  },
  {
    key: "office",
    label: "Materiales de Oficina",
    title: "Materiales de Oficina",
  },
  {
    key: "quality",
    label: "Inventario de Calidad",
    title: "Inventario de Calidad",
  },
];

const tabFamilies: Record<InventoryMainTab, InventoryFamilyTabKey[]> = {
  protection: ["epp", "epi", "uniform"],
  safety: ["ese"],
  ssomaSupply: ["ssomaSupply"],
  fall: ["harness"],
  office: ["officeMaterial"],
  quality: ["quality"],
  legacy: ["operative"],
};

const filterLabels: Record<string, string> = {
  all: "Todos",
  epp: "EPP",
  epi: "EPI",
  uniform: "Uniforme",
  officeMaterial: "Materiales de Oficina",
  ssomaSupply: "Insumos SSOMA",
  ese: "ESE",
  harness: "Todos",
  quality: "Calidad",
  operative: "Operative",
};

function getInitialTab(family: ReturnType<typeof resolveInventoryRouteFamily>): InventoryMainTab {
  if (family === "ese") return "safety";
  if (family === "ssomaSupply") return "ssomaSupply";
  if (family === "harness") return "fall";
  if (family === "officeMaterial") return "office";
  if (family === "quality") return "quality";
  if (family === "operative") return "protection";
  return "protection";
}

export default function Elements() {
  const { family, type } = useParams<{ family?: string; type?: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<InventoryMainTab>(() =>
    getInitialTab(resolveInventoryRouteFamily(family ?? type)),
  );
  const [familyFilter, setFamilyFilter] = useState<InventoryFilter>(() => {
    const routeFamily = resolveInventoryRouteFamily(family ?? type);
    return routeFamily === "all" || routeFamily === "operative" ? "all" : routeFamily;
  });
  const [safetyTypeFilter, setSafetyTypeFilter] = useState("all");
  const [epaCategoryFilter, setEpaCategoryFilter] = useState("all");
  const [epaView, setEpaView] = useState<EpaView>("groups");

  const isLegacyRoute = Boolean(type);

  const {
    data: elements,
    loading,
    error,
  } = useFetch<ElementType[]>(elementApi, []);
  const { data: fallProtectionGroups } = useFetch<FallProtectionGroupType[]>(
    `${elementApi}fall-protection-groups`,
    [],
  );

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

  const activeFamilies = tabFamilies[activeTab];
  const activeTitle = mainTabs.find((tab) => tab.key === activeTab)?.title ?? "Inventario";
  const visibleFilterOptions: InventoryFilter[] = ["all", ...activeFamilies];

  const safetyTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    (elements || []).forEach((element) => {
      const familyKey = getInventoryCatalogTabFromSource(element);
      if (familyKey !== "ese") return;

      const typeName = (element.categoryName || element.name || "Sin tipo").trim();
      counts[typeName] = (counts[typeName] || 0) + 1;
    });

    return counts;
  }, [elements]);

  const safetyTypeOptions = useMemo(
    () => Object.keys(safetyTypeCounts).sort((a, b) => a.localeCompare(b)),
    [safetyTypeCounts],
  );

  const epaCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    (elements || []).forEach((element) => {
      const familyKey = getInventoryCatalogTabFromSource(element);
      if (familyKey !== "harness") return;

      const category = getFallProtectionElementCategory(element);
      counts[category] = (counts[category] || 0) + 1;
    });

    return counts;
  }, [elements]);

  const epaCategoryOptions = useMemo(
    () => Object.keys(epaCategoryCounts).sort((a, b) => a.localeCompare(b)),
    [epaCategoryCounts],
  );

  const filteredElements = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (elements || []).filter((element) => {
      const familyKey = getInventoryCatalogTabFromSource(element);
      const typeName = (element.categoryName || element.name || "Sin tipo").trim();
      const matchesMainTab = activeFamilies.includes(familyKey);
      const matchesFamily = familyFilter === "all" || familyKey === familyFilter;
      const matchesSafetyType = activeTab !== "safety"
        || safetyTypeFilter === "all"
        || typeName === safetyTypeFilter;
      const matchesEpaCategory = activeTab !== "fall"
        || epaView !== "elements"
        || epaCategoryFilter === "all"
        || getFallProtectionElementCategory(element) === epaCategoryFilter;
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

      return matchesMainTab && matchesFamily && matchesSafetyType && matchesEpaCategory && matchesSearch;
    });
  }, [activeFamilies, activeTab, elements, epaCategoryFilter, epaView, familyFilter, safetyTypeFilter, searchTerm]);

  const filteredFallProtectionGroups = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (fallProtectionGroups || []).filter((group) => {
      if (!normalizedSearch) return true;

      return [
        group.code,
        group.description || "",
        group.harnessElement?.name || "",
        group.harnessElement?.code || "",
        group.anchorBandElement?.name || "",
        group.anchorBandElement?.code || "",
        group.lifelineElement?.name || "",
        group.lifelineElement?.code || "",
        group.positioningLanyardElement?.name || "",
        group.positioningLanyardElement?.code || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [fallProtectionGroups, searchTerm]);

  const nextFamily =
    familyFilter !== "all"
      ? familyFilter
      : activeTab === "safety"
        ? "ese"
        : activeTab === "ssomaSupply"
          ? "ssomaSupply"
          : activeTab === "fall"
            ? "harness"
            : activeTab === "office"
              ? "officeMaterial"
              : activeTab === "quality"
                ? "quality"
                : activeTab === "legacy"
                  ? "operative"
                  : "epp";

  const handleTabChange = (tab: InventoryMainTab) => {
    setActiveTab(tab);
    setFamilyFilter("all");
    setSafetyTypeFilter("all");
    setEpaCategoryFilter("all");
    if (tab === "fall") {
      setEpaView("groups");
    }
    navigate("/admin/inventory", { replace: true });
  };

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <Panel>
      <HeaderPanel name="Inventario SSOMA" />

      <div className="flex w-full flex-col gap-4">
        <p className="max-w-4xl text-sm text-gray-500">
          Catalogo maestro de Elementos de Proteccion, Equipos de Seguridad y Emergencia,
          y Proteccion Anticaida. Cada talla o modelo se registra como un elemento independiente.
        </p>

        {isLegacyRoute ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Esta ruta es heredada. Los registros operativos antiguos se muestran bajo la
            clasificacion actual para conservar el historial.
          </div>
        ) : null}

        <div className="flex flex-col gap-5 border-b border-gray-300 pb-4">
          <div className="flex flex-wrap gap-8">
            {mainTabs.map((tab) => {
              const active = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`border-b-4 px-1 pb-2 text-xl font-extrabold transition-colors ${
                    active
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                {activeTab === "fall" && epaView === "groups"
                  ? `${activeTitle} - Grupos`
                  : activeTab === "fall"
                    ? `${activeTitle} - Elementos`
                    : activeTitle}
              </h2>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="text-sm font-bold text-gray-700" htmlFor="inventorySearch">
                  Buscar
                </label>
                <input
                  id="inventorySearch"
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
                  placeholder="Buscar por nombre, codigo o categoria"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              {activeTab === "fall" ? (
                <button
                  type="button"
                  onClick={() => {
                    setEpaCategoryFilter("all");
                    setEpaView((view) => (view === "groups" ? "elements" : "groups"));
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cambiar a {epaView === "groups" ? "ELEMENTOS" : "GRUPOS"}
                </button>
              ) : null}

              {activeTab === "safety" ? (
                <select
                  value={safetyTypeFilter}
                  onChange={(event) => setSafetyTypeFilter(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-bold focus:outline-[#0047a3]"
                >
                  <option value="all">
                    Todos los tipos ({activeFamilies.reduce((total, item) => total + (familyCounts[item] || 0), 0)})
                  </option>
                  {safetyTypeOptions.map((typeName) => (
                    <option key={typeName} value={typeName}>
                      {typeName} ({safetyTypeCounts[typeName] || 0})
                    </option>
                  ))}
                </select>
              ) : activeTab === "fall" && epaView === "elements" ? (
                <select
                  value={epaCategoryFilter}
                  onChange={(event) => setEpaCategoryFilter(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-bold focus:outline-[#0047a3]"
                >
                  <option value="all">
                    Todas las categorias ({activeFamilies.reduce((total, item) => total + (familyCounts[item] || 0), 0)})
                  </option>
                  {epaCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category} ({epaCategoryCounts[category] || 0})
                    </option>
                  ))}
                </select>
              ) : activeTab === "fall" && epaView === "groups" ? null : (
                <select
                  value={familyFilter}
                  onChange={(event) => setFamilyFilter(event.target.value as InventoryFilter)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-bold focus:outline-[#0047a3]"
                >
                  {visibleFilterOptions.map((filter) => (
                    <option key={filter} value={filter}>
                      {filterLabels[filter]} ({filter === "all"
                        ? activeFamilies.reduce((total, item) => total + (familyCounts[item] || 0), 0)
                        : familyCounts[filter] || 0})
                    </option>
                  ))}
                </select>
              )}

              <AddButton
                onClick={() =>
                  navigate(
                    activeTab === "fall" && epaView === "groups"
                      ? "/admin/elements/new?family=harness&mode=group"
                      : `/admin/elements/new?family=${nextFamily}`,
                  )
                }
              />
            </div>
          </div>
        </div>

        {activeTab === "fall" && epaView === "groups" ? (
          <EpaGroupView
            groups={filteredFallProtectionGroups}
            hasFallProtectionElements={filteredElements.length > 0}
          />
        ) : !filteredElements.length ? (
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

function getFallProtectionElementCategory(element: ElementType) {
  return (element.categoryName || element.name || "Sin categoria").trim();
}

function EpaGroupView({
  groups,
  hasFallProtectionElements,
}: {
  groups: FallProtectionGroupType[];
  hasFallProtectionElements: boolean;
}) {
  const navigate = useNavigate();

  if (!groups.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
        {hasFallProtectionElements
          ? "Hay elementos EPA registrados, pero todavia no hay grupos EPA creados."
          : "Todavia no hay grupos EPA creados."}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <article
          key={group.fallProtectionGroupId}
          className="rounded-lg border border-gray-300 bg-white p-5 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-xl font-extrabold">{group.code}</h3>
            <button
              type="button"
              onClick={() => navigate(`/admin/inventory/harness`)}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm font-bold hover:bg-gray-50"
            >
              Ver
            </button>
          </div>

          <div className="rounded-md border border-gray-200 p-3">
            <p className="mb-2 text-sm font-extrabold uppercase">Partes</p>
            <GroupPartLine label="Arnes" element={group.harnessElement} />
            <GroupPartLine label="Banda de anclaje" element={group.anchorBandElement} />
            <GroupPartLine label="Linea de vida" element={group.lifelineElement} />
            <GroupPartLine
              label="Eslinga de posicionamiento"
              element={group.positioningLanyardElement}
            />
          </div>

          <div className="mt-3 rounded-md border border-gray-200 p-3 text-sm">
            <p className="mb-2 font-extrabold uppercase">Datos del equipo</p>
            <p><span className="font-semibold">Ubicacion actual:</span> Oficina</p>
            <p><span className="font-semibold">Responsable:</span> -</p>
            <p className="mt-1 text-gray-500 line-clamp-3">
              {group.description || "Sin observaciones registradas."}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

function GroupPartLine({
  label,
  element,
}: {
  label: string;
  element?: ElementType;
}) {
  return (
    <p className="flex items-center justify-between gap-2 text-sm">
      <span>
        <span className="font-semibold">{label}:</span>{" "}
        {element?.code || element?.name || "Pendiente"}
      </span>
      <span
        className={`inline-flex size-3 shrink-0 rounded-full border ${
          element ? "border-emerald-500 bg-emerald-100" : "border-red-500 bg-red-100"
        }`}
      />
    </p>
  );
}
