import type {
  ElementRequestType,
  ElementType,
} from "../../data/types";
import {
  getInventoryFamilyConfig,
  getInventoryFamilyFromSource,
} from "../Elements/inventoryCatalog";

function randomLineToken() {
  return Math.random().toString(36).slice(2, 10);
}

export function createRequestLineKey() {
  return `line-${Date.now()}-${randomLineToken()}`;
}

export function getRequestLineKey(
  line: Pick<ElementRequestType, "lineKey" | "elementRequestId">,
  fallbackIndex?: number,
) {
  if (line.lineKey) return line.lineKey;
  if (line.elementRequestId) return `persisted-${line.elementRequestId}`;
  if (typeof fallbackIndex === "number") return `draft-${fallbackIndex}-${randomLineToken()}`;
  return createRequestLineKey();
}

export function attachRequestLineKeys(
  lines: ElementRequestType[],
) {
  return lines.map((line, index) => ({
    ...line,
    lineKey: getRequestLineKey(line, index),
  }));
}

export type RequestLineSectionKey =
  | "protection"
  | "safety"
  | "fallProtection"
  | "officeMaterial";

export const requestLineSectionLabels: Record<RequestLineSectionKey, string> = {
  protection: "Elementos de Proteccion",
  safety: "Equipos de Seguridad y Emergencia",
  fallProtection: "Equipos de Proteccion Anticaida",
  officeMaterial: "Materiales de Oficina",
};

export function getRequestLineFamily(
  line?: Pick<ElementRequestType, "element" | "fallProtectionGroup" | "fallProtectionGroupId"> | null,
) {
  if (line?.fallProtectionGroup || line?.fallProtectionGroupId) {
    return "harness";
  }

  return getInventoryFamilyFromSource(line?.element);
}

export function getRequestLineSectionKey(
  line: Pick<ElementRequestType, "element" | "fallProtectionGroup" | "fallProtectionGroupId">,
): RequestLineSectionKey {
  const family = getRequestLineFamily(line);

  if (family === "harness") return "fallProtection";
  if (family === "ese") return "safety";
  if (family === "officeMaterial") return "officeMaterial";
  return "protection";
}

export function groupRequestLinesBySection(lines: ElementRequestType[]) {
  const sections: Array<{
    key: RequestLineSectionKey;
    label: string;
    rows: ElementRequestType[];
  }> = [
    { key: "protection", label: requestLineSectionLabels.protection, rows: [] },
    { key: "safety", label: requestLineSectionLabels.safety, rows: [] },
    { key: "fallProtection", label: requestLineSectionLabels.fallProtection, rows: [] },
    { key: "officeMaterial", label: requestLineSectionLabels.officeMaterial, rows: [] },
  ];

  const byKey = new Map<RequestLineSectionKey, ElementRequestType[]>(
    sections.map((section) => [section.key, section.rows]),
  );

  lines.forEach((line) => {
    byKey.get(getRequestLineSectionKey(line))?.push(line);
  });

  return sections.filter((section) => section.rows.length > 0);
}

function formatElementNameWithCode(element?: ElementType | null) {
  if (!element) return "Pendiente";
  return element.code ? `${element.name} - ${element.code}` : element.name;
}

export function getFallProtectionGroupParts(line: Pick<ElementRequestType, "fallProtectionGroup">) {
  const group = line.fallProtectionGroup;
  if (!group) return [];

  return [
    `Arnes: ${formatElementNameWithCode(group.harnessElement)}`,
    `Banda de anclaje: ${formatElementNameWithCode(group.anchorBandElement)}`,
    `Linea de vida: ${formatElementNameWithCode(group.lifelineElement)}`,
    `Eslinga de posicionamiento: ${formatElementNameWithCode(group.positioningLanyardElement)}`,
  ];
}

export function usesUniqueRequestQuantity(line?: Pick<ElementRequestType, "element"> | null) {
  const family = getRequestLineFamily(line);
  return Boolean(getInventoryFamilyConfig(family)?.unique);
}

export function shouldShowRequestLineNotes(
  line?: Pick<ElementRequestType, "element"> | null,
) {
  const family = getRequestLineFamily(line);
  return ["epp", "epi", "uniform", "ese", "harness", "officeMaterial"].includes(family);
}

export function createElementRequestLine(
  element: ElementType,
  requestId = 0,
): ElementRequestType {
  return {
    lineKey: createRequestLineKey(),
    requestId,
    elementId: element.elementId,
    elementVariantId: null,
    fallProtectionGroupId: element.fallProtectionGroupId ?? null,
    lineItemOrder: 0,
    quantityRequested: 1,
    unit: "unidad",
    notes: "",
    element,
    fallProtectionGroup: element.fallProtectionGroup ?? null,
    epiPlans: [],
  };
}

export function getRequestLineElementLabel(line: ElementRequestType) {
  if (line.fallProtectionGroup) {
    return line.fallProtectionGroup.code;
  }

  if (getRequestLineFamily(line) === "ese") {
    return line.element?.name || `Elemento ${line.elementId}`;
  }

  return line.element?.code
    ? `${line.element.name} - ${line.element.code}`
    : line.element?.name || `Elemento ${line.elementId}`;
}

export function getUniqueElementsFromLines(
  lines: ElementRequestType[],
  fallbackElements: ElementType[] = [],
) {
  const byId = new Map<number, ElementType>();

  fallbackElements.forEach((element) => {
    byId.set(element.elementId, element);
  });

  lines.forEach((line) => {
    if (line.element?.elementId) {
      byId.set(line.element.elementId, line.element);
    }
  });

  return Array.from(byId.values());
}
