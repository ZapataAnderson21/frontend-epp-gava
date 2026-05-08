import { useNavigate } from "react-router-dom";
import { SeeButton } from "../../common/button";
import { Table } from "../../common/table";
import type { ElementType } from "../../data/types";
import {
  getInventoryCatalogTabFromSource,
  getInventoryFamilyConfig,
} from "./inventoryCatalog";

interface ElementTableProps {
  elements: ElementType[];
}

export default function ElementTable({ elements }: ElementTableProps) {
  const navigate = useNavigate();
  const isSafetyEquipmentTable =
    elements.length > 0 &&
    elements.every((element) =>
      getInventoryCatalogTabFromSource(element) === "ese",
    );
  const isFallProtectionTable =
    elements.length > 0 &&
    elements.every((element) =>
      getInventoryCatalogTabFromSource(element) === "harness",
    );
  const categoryColumn = {
    key: "categoryName",
    label: "Categoria",
    width: "11rem",
    render: (row: ElementType) => getDisplayCategory(row, isFallProtectionTable),
  } as const;

  const columns = [
    { key: "elementId", label: "N°", width: "4rem" },
    { key: "name", label: isSafetyEquipmentTable ? "Tipo" : "Nombre", width: "16rem" },
    {
      key: "code",
      label: isSafetyEquipmentTable ? "Serie" : "Codigo",
      width: "8rem",
      render: (row: ElementType) => row.code || "Sin codigo",
    },
    ...(!isSafetyEquipmentTable ? [categoryColumn] : []),
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

function getDisplayCategory(row: ElementType, isFallProtectionTable: boolean) {
  const familyKey = getInventoryCatalogTabFromSource(row);

  if (familyKey === "epp" || familyKey === "epi" || familyKey === "uniform") {
    return getInventoryFamilyConfig(familyKey)?.label || row.familyLabel || "Sin categoria";
  }

  if (isFallProtectionTable) {
    return row.categoryName || row.name || "Sin categoria";
  }

  return row.categoryName || row.familyLabel || "Sin categoria";
}
