import type { ElementType } from "../../data/types";

export type InventoryFamilyKey =
  | "all"
  | "operative"
  | "epp"
  | "epi"
  | "uniform"
  | "officeMaterial"
  | "ssomaSupply"
  | "ese"
  | "harness"
  | "quality";
export type InventoryFamilyTabKey = Exclude<InventoryFamilyKey, "all">;

export type InventoryControlType = "consumable" | "returnable" | "individual";
export type InventoryBackendType = "epp" | "operative";
export type InventoryBackendFamily =
  | "epp"
  | "epi"
  | "uniform"
  | "officeMaterial"
  | "ssomaSupply"
  | "ese"
  | "harness"
  | "measurement";
export type InventoryCatalogSection = "ssoma" | "office" | "quality" | "legacy";

export interface InventorySourceLike {
  type?: string | null;
  controlType?: string | null;
  code?: string | null;
  family?: string | null;
}

export type InventoryElementLike = ElementType & {
  deletedAt?: string | null;
  family?: string | null;
};

export interface InventoryFamilyConfig {
  key: InventoryFamilyTabKey;
  label: string;
  shortLabel: string;
  description: string;
  backendType: InventoryBackendType;
  backendFamily: InventoryBackendFamily;
  backendControlType: InventoryControlType;
  requiresCode: boolean;
  returnsToOffice: boolean;
  unique: boolean;
  consumable: boolean;
  supportsVariants: boolean;
  section: InventoryCatalogSection;
}

export const inventoryFamilies: readonly InventoryFamilyConfig[] = [
  {
    key: "epp",
    label: "EPP",
    shortLabel: "EPP",
    description: "Elementos de proteccion personal",
    backendType: "epp",
    backendFamily: "epp",
    backendControlType: "returnable",
    requiresCode: false,
    returnsToOffice: true,
    unique: false,
    consumable: false,
    supportsVariants: false,
    section: "ssoma",
  },
  {
    key: "uniform",
    label: "Uniforme",
    shortLabel: "Uniforme",
    description: "Uniformes y prendas no retornables a oficina",
    backendType: "epp",
    backendFamily: "uniform",
    backendControlType: "consumable",
    requiresCode: false,
    returnsToOffice: false,
    unique: false,
    consumable: false,
    supportsVariants: false,
    section: "ssoma",
  },
  {
    key: "epi",
    label: "EPI",
    shortLabel: "EPI",
    description: "Elementos de proteccion individual",
    backendType: "epp",
    backendFamily: "epi",
    backendControlType: "individual",
    requiresCode: false,
    returnsToOffice: true,
    unique: false,
    consumable: false,
    supportsVariants: false,
    section: "ssoma",
  },
  {
    key: "officeMaterial",
    label: "Materiales de Oficina",
    shortLabel: "Mat. Oficina",
    description: "Materiales de oficina con stock y retorno opcional",
    backendType: "epp",
    backendFamily: "officeMaterial",
    backendControlType: "consumable",
    requiresCode: false,
    returnsToOffice: false,
    unique: false,
    consumable: false,
    supportsVariants: false,
    section: "office",
  },
  {
    key: "ssomaSupply",
    label: "Insumos SSOMA",
    shortLabel: "Insumos",
    description: "Insumos SSOMA controlados por cantidad",
    backendType: "operative",
    backendFamily: "ssomaSupply",
    backendControlType: "consumable",
    requiresCode: false,
    returnsToOffice: false,
    unique: false,
    consumable: true,
    supportsVariants: false,
    section: "ssoma",
  },
  {
    key: "ese",
    label: "ESE",
    shortLabel: "ESE",
    description: "Equipos de seguridad y/o emergencia",
    backendType: "operative",
    backendFamily: "ese",
    backendControlType: "returnable",
    requiresCode: false,
    returnsToOffice: true,
    unique: false,
    consumable: false,
    supportsVariants: false,
    section: "ssoma",
  },
  {
    key: "harness",
    label: "ARNES",
    shortLabel: "ARNES",
    description: "Arneses y sus partes trazables",
    backendType: "operative",
    backendFamily: "harness",
    backendControlType: "individual",
    requiresCode: true,
    returnsToOffice: true,
    unique: true,
    consumable: false,
    supportsVariants: false,
    section: "ssoma",
  },
  {
    key: "quality",
    label: "Calidad",
    shortLabel: "Calidad",
    description: "Equipos de medicion y control de calibracion",
    backendType: "operative",
    backendFamily: "measurement",
    backendControlType: "individual",
    requiresCode: false,
    returnsToOffice: true,
    unique: true,
    consumable: false,
    supportsVariants: false,
    section: "quality",
  },
] as const;

export const inventoryFamilyTabs = [
  { key: "all" as const, label: "Todos" },
  { key: "operative" as const, label: "Operative" },
  ...inventoryFamilies.map((family) => ({
    key: family.key,
    label: family.label,
  })),
] as const;

export const inventoryFamilyTabGroups = [
  {
    key: "all" as const,
    label: "Catalogo",
    tabs: [{ key: "all" as const, label: "Todos" }],
  },
  {
    key: "protection" as const,
    label: "Elementos de Proteccion",
    tabs: inventoryFamilies
      .filter((family) => ["epp", "epi", "uniform"].includes(family.key))
      .map((family) => ({ key: family.key, label: family.label })),
  },
  {
    key: "safety" as const,
    label: "Equipos SSOMA",
    tabs: inventoryFamilies
      .filter((family) => family.key === "ese" || family.key === "ssomaSupply")
      .map((family) => ({ key: family.key, label: family.label })),
  },
  {
    key: "fall_protection" as const,
    label: "Proteccion Anticaida",
    tabs: inventoryFamilies
      .filter((family) => family.key === "harness")
      .map((family) => ({ key: family.key, label: family.label })),
  },
  {
    key: "office" as const,
    label: "Materiales de Oficina",
    tabs: inventoryFamilies
      .filter((family) => family.section === "office")
      .map((family) => ({ key: family.key, label: family.label })),
  },
  {
    key: "quality" as const,
    label: "Inventario de Calidad",
    tabs: inventoryFamilies
      .filter((family) => family.section === "quality")
      .map((family) => ({ key: family.key, label: family.label })),
  },
] as const;

export function getInventoryFamilyConfig(family: InventoryFamilyKey) {
  if (family === "all") {
    return null;
  }

  return inventoryFamilies.find((item) => item.key === family) ?? null;
}

export function resolveInventoryRouteFamily(
  rawValue?: string | null,
): InventoryFamilyKey {
  const normalized = rawValue?.trim().toLowerCase();

  if (!normalized) return "all";
  if (normalized === "all") return "all";
  if (normalized === "operative") return "operative";

  const knownFamily = inventoryFamilies.find(
    (family) => family.key.toLowerCase() === normalized,
  );
  if (knownFamily) return knownFamily.key;

  return "all";
}

export function isLegacyOperativeSource(source?: InventorySourceLike | null) {
  return !source?.family && source?.type?.trim().toLowerCase() === "operative";
}

export function getInventoryFamilyFromSource(
  source?: InventorySourceLike | null,
): InventoryFamilyTabKey {
  const familyField = source?.family?.trim().toLowerCase();
  const explicitFamily = inventoryFamilies.find(
    (item) =>
      item.key.toLowerCase() === familyField ||
      item.backendFamily.toLowerCase() === familyField,
  );
  if (explicitFamily) return explicitFamily.key;

  const type = source?.type?.trim().toLowerCase();
  const controlType = source?.controlType?.trim().toLowerCase();

  if (controlType === "consumable") {
    if (type === "epp") {
      return "uniform";
    }
    return "operative";
  }

  if (type === "operative") {
    return controlType === "individual" ? "quality" : "ese";
  }

  if (controlType === "individual") {
    return "epi";
  }

  return "epp";
}

export function getInventoryCatalogTabFromSource(
  source?: InventorySourceLike | null,
): InventoryFamilyTabKey {
  if (isLegacyOperativeSource(source)) {
    return "operative";
  }

  return getInventoryFamilyFromSource(source);
}

export function getInventoryFamilyLabel(family: InventoryFamilyKey) {
  if (family === "all") return "Todos";
  if (family === "operative") return "Operative";
  return getInventoryFamilyConfig(family)?.label ?? "Inventario";
}

export function getInventoryRuleLabel(source?: InventorySourceLike | null) {
  const family = getInventoryFamilyFromSource(source);
  const config = getInventoryFamilyConfig(family);

  if (!config) return "Stock";
  if (config.consumable) return "Consumible";
  if (config.unique) return "Activo unico";
  return "Stock";
}

export function usesInventoryStockFields(family: InventoryFamilyKey) {
  return (
    family === "epp" ||
    family === "epi" ||
    family === "uniform" ||
    family === "officeMaterial" ||
    family === "ssomaSupply"
  );
}

export function getInventoryCodeRequirementLabel(family: InventoryFamilyKey) {
  const config = getInventoryFamilyConfig(family);
  if (!config) return "Opcional";
  return config.requiresCode ? "Obligatorio" : "Opcional";
}

export function getInventoryBackendPayload(family: InventoryFamilyKey) {
  const config = getInventoryFamilyConfig(family);
  if (!config) {
    return {
      type: "epp" as InventoryBackendType,
      family: "epp" as InventoryBackendFamily,
      controlType: "returnable" as InventoryControlType,
    };
  }

  return {
    type: config.backendType,
    family: config.backendFamily,
    controlType: config.backendControlType,
  };
}

export function getInventorySectionLabel(family: InventoryFamilyKey) {
  const config = getInventoryFamilyConfig(family);
  if (!config) return "Catalogo";

  switch (config.section) {
    case "ssoma":
      return "Inventario SSOMA";
    case "office":
      return "Materiales de Oficina";
    case "quality":
      return "Inventario de Calidad";
    default:
      return "Legado";
  }
}

export function formatInventoryQuantity(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2).replace(/\.00$/, "");
}
