import { useNavigate } from "react-router-dom";
import { SeeButton } from "../../common/button";
import { Table } from "../../common/table";
import type { ElementType } from "../../data/types";
import {
  getInventoryCatalogTabFromSource,
  getInventoryFamilyLabel,
  getInventoryRuleLabel,
  isLegacyOperativeSource,
} from "./inventoryCatalog";

interface ElementTableProps {
  elements: ElementType[];
}

export default function ElementTable({ elements }: ElementTableProps) {
  const navigate = useNavigate();

  const columns = [
    { key: "elementId", label: "Id", width: "4rem" },
    { key: "name", label: "Nombre", width: "16rem" },
    {
      key: "code",
      label: "Codigo",
      width: "8rem",
      render: (row: ElementType) => row.code || "Sin codigo",
    },
    {
      key: "type",
      label: "Familia",
      width: "12rem",
      render: (row: ElementType) => {
        const family = getInventoryCatalogTabFromSource(row);
        const legacyOperative = isLegacyOperativeSource(row);
        return (
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              legacyOperative
                ? "bg-amber-50 text-amber-800"
                : "bg-blue-50 text-[#0047a3]"
            }`}
          >
            {legacyOperative ? "Operative legado" : getInventoryFamilyLabel(family)}
          </span>
        );
      },
    },
    {
      key: "categoryName",
      label: "Categoria",
      width: "11rem",
      render: (row: ElementType) => row.categoryName || "Sin categoria",
    },
    {
      key: "controlType",
      label: "Regla",
      width: "10rem",
      render: (row: ElementType) => getInventoryRuleLabel(row),
    },
    {
      key: "description",
      label: "Descripcion",
      width: "24rem",
      truncate: true,
    },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: ElementType) => (
        <SeeButton onClick={() => navigate(`/admin/elements/${row.elementId}`)} />
      ),
    },
  ] as const;

  return <Table<ElementType> data={elements} columns={columns} />;
}
