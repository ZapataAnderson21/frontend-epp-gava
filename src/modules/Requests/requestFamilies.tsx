import type { ReactNode } from "react";
import {
  FireExtinguisher as FaFireExtinguisher,
  HardHat as FaHelmetSafety,
  PackageOpen as FaBoxOpen,
} from "lucide-react";

import type { InventoryFamilyTabKey } from "../Elements/inventoryCatalog";
import { getInventoryFamilyConfig } from "../Elements/inventoryCatalog";

export const requestFamilyTabs: {
  key: InventoryFamilyTabKey;
  label: string;
  title: string;
  icon: ReactNode;
}[] = [
  {
    key: "epp",
    label: "EPP",
    title: "Elementos de protección personal e individual",
    icon: <FaHelmetSafety className="size-12" />,
  },
  {
    key: "uniform",
    label: "Ropa de Trabajo",
    title: "Prendas configuradas por artículo y talla",
    icon: <FaBoxOpen className="size-12" />,
  },
  {
    key: "ese",
    label: "Eq. Seg. y Emerg.",
    title: "Equipos de seguridad y/o emergencia",
    icon: <FaFireExtinguisher className="size-12" />,
  },
];

export function getRequestFamilyTab(key: InventoryFamilyTabKey) {
  return requestFamilyTabs.find((tab) => tab.key === key);
}

export function getRequestFamilyDescription(key: InventoryFamilyTabKey) {
  return (
    getRequestFamilyTab(key)?.title ??
    getInventoryFamilyConfig(key)?.description ??
    "Inventario"
  );
}
