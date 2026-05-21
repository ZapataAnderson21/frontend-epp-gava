import { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { elementApi, inventoryApi } from "../../../data/apiUrl";
import type {
  ElementType,
  FallProtectionGroupType,
  OfficeInventoryEntry,
} from "../../../data/types";
import { useFetch } from "../../../hooks";
import {
  formatInventoryQuantity,
  getInventoryBackendPayload,
  getInventoryFamilyFromSource,
  getInventoryFamilyLabel,
  type InventoryFamilyTabKey,
} from "../../Elements/inventoryCatalog";

interface RequestItemPickerProps {
  familyKey: InventoryFamilyTabKey;
  onAddElement: (element: ElementType) => void;
}

type PickerElement = ElementType & {
  requestTypeLabel?: string;
  availableCount?: number;
  availableCodes?: string[];
};

type OfficeInventoryPayload =
  | OfficeInventoryEntry[]
  | {
      entries?: OfficeInventoryEntry[];
      items?: OfficeInventoryEntry[];
      data?: OfficeInventoryEntry[];
    };

const protectionFilters = [
  { value: "all", label: "Todos" },
  { value: "epp", label: "EPP" },
  { value: "epi", label: "EPI" },
  { value: "uniform", label: "Uniforme" },
] as const;

function isVisibleForFamily(element: ElementType, familyKey: InventoryFamilyTabKey) {
  const family = getInventoryFamilyFromSource(element);

  if (familyKey === "epp") {
    return ["epp", "epi", "uniform"].includes(family);
  }

  return family === familyKey;
}

function getSafetyEquipmentType(element: ElementType) {
  return (element.categoryName || element.name || "Sin tipo").trim();
}

function getSafetyEquipmentCode(element: ElementType) {
  return element.code || element.serialNumber || null;
}

function isOperationalSafetyEquipment(element: ElementType) {
  const status = (element.operationalStatus || "operativo").trim().toLowerCase();
  return status !== "inoperativo" && status !== "inoperative";
}

function hasAnyOfficeEntry(
  elementId: number,
  officeEntries: OfficeInventoryEntry[] = [],
) {
  const entries = Array.isArray(officeEntries) ? officeEntries : [];

  return entries.some((entry) => entry.elementId === elementId);
}

function hasAvailableOfficeEntry(
  elementId: number,
  officeEntries: OfficeInventoryEntry[] = [],
) {
  const entries = Array.isArray(officeEntries) ? officeEntries : [];

  return entries.some(
    (entry) =>
      entry.elementId === elementId &&
      entry.status !== "disposed" &&
      Number(entry.currentStock || 0) > 0,
  );
}

function getAvailableSafetyUnitCount(
  element: ElementType,
  officeEntries: OfficeInventoryEntry[] = [],
) {
  if (!isOperationalSafetyEquipment(element)) return 0;

  if (hasAvailableOfficeEntry(element.elementId, officeEntries)) return 1;

  // Existing ESE records created before location tracking are physical units.
  // If they have no office row yet, treat them as available in office once.
  return hasAnyOfficeEntry(element.elementId, officeEntries) ? 0 : 1;
}

function groupSafetyEquipmentByType(
  elements: ElementType[],
  officeEntries: OfficeInventoryEntry[] = [],
) {
  const groups = new Map<string, ElementType[]>();

  elements.forEach((element) => {
    const typeLabel = getSafetyEquipmentType(element);
    const key = typeLabel.toLowerCase();
    groups.set(key, [...(groups.get(key) || []), element]);
  });

  return Array.from(groups.values()).map<PickerElement>((items) => {
    const [representative] = items;
    const typeLabel = getSafetyEquipmentType(representative);
    const availableItems = items.filter(
      (item) => getAvailableSafetyUnitCount(item, officeEntries) > 0,
    );
    const availableCodes = availableItems
      .map((item) => getSafetyEquipmentCode(item))
      .filter((code): code is string => Boolean(code));
    const availableCount = availableItems.length;

    return {
      ...representative,
      name: typeLabel,
      code: null,
      categoryName: typeLabel,
      requestTypeLabel: typeLabel,
      availableCount,
      availableCodes,
      assetSummary: {
        totalAssets: items.length,
        availableAssets: availableCount,
        assignedAssets: items.reduce(
          (total, item) => total + (item.assetSummary?.assignedAssets ?? 0),
          0,
        ),
        maintenanceAssets: items.reduce(
          (total, item) => total + (item.assetSummary?.maintenanceAssets ?? 0),
          0,
        ),
        retiredAssets: items.reduce(
          (total, item) => total + (item.assetSummary?.retiredAssets ?? 0),
          0,
        ),
      },
    };
  });
}

function normalizeOfficeEntries(payload: OfficeInventoryPayload | null) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  if (Array.isArray(payload.entries)) return payload.entries;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;

  return [];
}

function getGroupPartLabel(element?: ElementType) {
  if (!element) return "Pendiente";
  return element.code ? `${element.name} (${element.code})` : element.name;
}

function getFallProtectionGroupParts(group: FallProtectionGroupType) {
  return [
    `Arnes: ${getGroupPartLabel(group.harnessElement)}`,
    `Banda de anclaje: ${getGroupPartLabel(group.anchorBandElement)}`,
    `Linea de vida: ${getGroupPartLabel(group.lifelineElement)}`,
    `Eslinga de posicionamiento: ${getGroupPartLabel(group.positioningLanyardElement)}`,
  ];
}

function mapFallProtectionGroupToPickerElement(group: FallProtectionGroupType): PickerElement {
  const referenceElement =
    group.harnessElement ||
    group.anchorBandElement ||
    group.lifelineElement ||
    group.positioningLanyardElement;
  const description = group.description || getFallProtectionGroupParts(group).join(", ");

  return {
    ...(referenceElement as ElementType),
    elementId: group.harnessElementId,
    name: group.code,
    code: null,
    description,
    family: "harness",
    familyLabel: "EPA",
    categoryName: "Grupo EPA",
    type: referenceElement?.type || "operative",
    controlType: referenceElement?.controlType || "individual",
    fallProtectionGroupId: group.fallProtectionGroupId,
    fallProtectionGroup: group,
  };
}

function buildItemDescription(element: PickerElement, familyKey: InventoryFamilyTabKey) {
  if (familyKey === "harness" && element.fallProtectionGroup) {
    return {
      meta: getFallProtectionGroupParts(element.fallProtectionGroup).join(", "),
      detail: element.fallProtectionGroup.description || "",
      highlight: "text-gray-500",
    };
  }

  const family = getInventoryFamilyFromSource(element);
  const details = [
    getInventoryFamilyLabel(family),
    element.code ? `Codigo ${element.code}` : null,
    element.categoryName,
    element.description,
  ].filter(Boolean);

  if (familyKey === "ese") {
    const available = element.availableCount ?? element.assetSummary?.availableAssets ?? 0;
    const codes = element.availableCodes?.slice(0, 3).join(", ");
    return {
      meta: `${formatInventoryQuantity(available)} disponible${available === 1 ? "" : "s"}`,
      detail: codes ? `Series: ${codes}` : details.join(", "),
      highlight: available > 0 ? "text-emerald-600" : "text-red-500",
    };
  }

  return {
    meta: details.slice(0, 3).join(", "),
    detail: element.description,
    highlight: "text-gray-500",
  };
}

export default function RequestItemPicker({
  familyKey,
  onAddElement,
}: RequestItemPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [familyFilter, setFamilyFilter] = useState<(typeof protectionFilters)[number]["value"]>("all");
  const [safetyTypeFilter, setSafetyTypeFilter] = useState("all");

  useEffect(() => {
    setFamilyFilter("all");
    setSafetyTypeFilter("all");
    setSearchTerm("");
  }, [familyKey]);

  const backendPayload = getInventoryBackendPayload(familyKey);
  const isProtectionGroup = familyKey === "epp";
  const { data: fetchedElements, loading, error } = useFetch<ElementType[]>(
    familyKey === "harness"
      ? ""
      : isProtectionGroup
        ? elementApi
        : `${elementApi}family/${backendPayload.family}`,
    [backendPayload.family, isProtectionGroup],
  );
  const {
    data: fallProtectionGroups,
    loading: loadingFallProtectionGroups,
    error: fallProtectionGroupsError,
  } = useFetch<FallProtectionGroupType[]>(
    familyKey === "harness" ? `${elementApi}fall-protection-groups` : "",
    [familyKey],
  );
  const {
    data: officeInventoryPayload,
    loading: loadingOfficeEntries,
    error: officeEntriesError,
  } = useFetch<OfficeInventoryPayload>(
    familyKey === "ese" ? `${inventoryApi}office` : "",
    [familyKey],
  );

  const officeEntries = useMemo(
    () => normalizeOfficeEntries(officeInventoryPayload),
    [officeInventoryPayload],
  );

  const safetyTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    (fetchedElements || [])
      .filter((element) => isVisibleForFamily(element, familyKey))
      .forEach((element) => {
        const typeName = getSafetyEquipmentType(element);
        counts[typeName] = (counts[typeName] || 0) + 1;
      });

    return counts;
  }, [familyKey, fetchedElements]);

  const safetyTypeOptions = useMemo(
    () => Object.keys(safetyTypeCounts).sort((a, b) => a.localeCompare(b)),
    [safetyTypeCounts],
  );

  const visibleElements = useMemo<PickerElement[]>(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (familyKey === "harness") {
      return (fallProtectionGroups || [])
        .map(mapFallProtectionGroupToPickerElement)
        .filter((element) => {
          if (!normalizedSearch) return true;

          const group = element.fallProtectionGroup;
          return [
            group?.code || "",
            group?.description || "",
            getFallProtectionGroupParts(group as FallProtectionGroupType).join(" "),
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);
        });
    }

    const filteredElements = (fetchedElements || [])
      .filter((element) => !element.deletedAt && !element.isArchived)
      .filter((element) => isVisibleForFamily(element, familyKey))
      .filter((element) => {
        const family = getInventoryFamilyFromSource(element);
        return familyFilter === "all" || family === familyFilter;
      })
      .filter((element) => {
        if (familyKey !== "ese" || safetyTypeFilter === "all") return true;
        return getSafetyEquipmentType(element) === safetyTypeFilter;
      })
      .filter((element) => {
        if (!normalizedSearch) return true;

        return [
          element.name,
          element.code || "",
          element.categoryName || "",
          element.description || "",
          getInventoryFamilyLabel(getInventoryFamilyFromSource(element)),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      });

    if (familyKey === "ese") {
      return groupSafetyEquipmentByType(filteredElements, officeEntries);
    }

    return filteredElements;
  }, [
    fallProtectionGroups,
    familyFilter,
    familyKey,
    fetchedElements,
    officeEntries,
    safetyTypeFilter,
    searchTerm,
  ]);

  return (
    <aside className="flex min-h-[24rem] flex-col gap-3 border-t border-gray-300 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
      <label className="text-sm font-bold text-gray-700" htmlFor="requestItemSearch">
        Buscar
      </label>
      <div className="flex gap-2">
        <input
          id="requestItemSearch"
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-[#0047a3]"
          placeholder="Buscar por nombre, codigo o categoria"
        />
        {familyKey === "epp" ? (
          <select
            value={familyFilter}
            onChange={(event) => setFamilyFilter(event.target.value as typeof familyFilter)}
            className="w-32 rounded-md border border-gray-300 px-2 py-2 text-sm font-semibold focus:outline-[#0047a3]"
          >
            {protectionFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
              {filter.label}
              </option>
            ))}
          </select>
        ) : familyKey === "ese" ? (
          <select
            value={safetyTypeFilter}
            onChange={(event) => setSafetyTypeFilter(event.target.value)}
            className="w-40 rounded-md border border-gray-300 px-2 py-2 text-sm font-semibold focus:outline-[#0047a3]"
          >
            <option value="all">Todos los tipos</option>
            {safetyTypeOptions.map((typeName) => (
              <option key={typeName} value={typeName}>
                {typeName}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto pr-1">
        {loading || loadingOfficeEntries || loadingFallProtectionGroups ? (
          <div className="rounded-md border border-gray-200 p-4 text-sm text-gray-500">
            Cargando elementos...
          </div>
        ) : error || officeEntriesError || fallProtectionGroupsError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error || officeEntriesError || fallProtectionGroupsError}
          </div>
        ) : !visibleElements.length ? (
          <div className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            No hay elementos para agregar.
          </div>
        ) : (
          visibleElements.map((element) => {
            const description = buildItemDescription(element, familyKey);

            return (
              <button
                key={
                  familyKey === "harness"
                    ? `epa-group-${element.fallProtectionGroupId}`
                    : familyKey === "ese"
                      ? element.requestTypeLabel
                      : element.elementId
                }
                type="button"
                onClick={() => onAddElement(element)}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-gray-300 bg-white px-3 py-2 text-left transition-colors hover:border-[#0047a3] hover:bg-blue-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-base font-bold text-gray-900">
                    {element.name}
                  </span>
                  <span className={`block truncate text-xs font-semibold ${description.highlight}`}>
                    {description.meta}
                  </span>
                  {description.detail ? (
                    <span className="block truncate text-xs text-gray-500">
                      {description.detail}
                    </span>
                  ) : null}
                </span>
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-gray-900 text-white">
                  <FaPlus className="size-4" />
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
