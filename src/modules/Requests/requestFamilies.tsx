import type { ReactNode } from "react";
import { FaHelmetSafety, FaPersonDigging } from "react-icons/fa6";
import { FaFireExtinguisher, FaRulerCombined } from "react-icons/fa";
import { MdInventory2 } from "react-icons/md";
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
    title: "Elementos de proteccion personal",
    icon: <FaHelmetSafety className="size-12" />,
  },
  {
    key: "epi",
    label: "EPI",
    title: "Elementos de proteccion individual",
    icon: <FaPersonDigging className="size-12" />,
  },
  {
    key: "ese",
    label: "ESE",
    title: "Equipos de seguridad y/o emergencia",
    icon: <FaFireExtinguisher className="size-12" />,
  },
  {
    key: "em",
    label: "EM",
    title: "Equipos de medicion",
    icon: <FaRulerCombined className="size-12" />,
  },
  {
    key: "consumibles",
    label: "Consumibles SSOMA",
    title: "Consumibles SSOMA",
    icon: <MdInventory2 className="size-12" />,
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
