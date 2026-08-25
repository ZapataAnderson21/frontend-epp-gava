import type { ReactNode } from "react";
import {
  FireExtinguisher as FaFireExtinguisher,
  HardHat as FaHelmetSafety,
  Link as FaLink,
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
    label: "Elem. de Proteccion",
    title: "Elementos de proteccion personal, individual y uniforme",
    icon: <FaHelmetSafety className="size-12" />,
  },
  {
    key: "ese",
    label: "Eq. Seg. y Emerg.",
    title: "Equipos de seguridad y/o emergencia",
    icon: <FaFireExtinguisher className="size-12" />,
  },
  {
    key: "ssomaSupply",
    label: "Insumos SSOMA",
    title: "Insumos SSOMA controlados por cantidad",
    icon: <FaBoxOpen className="size-12" />,
  },
  {
    key: "harness",
    label: "Eq. Protecc. Anticaida",
    title: "Equipos de proteccion anticaida agrupados",
    icon: <FaLink className="size-12" />,
  },
  {
    key: "officeMaterial",
    label: "Mat. Oficina",
    title: "Materiales de oficina",
    icon: <FaBoxOpen className="size-12" />,
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
