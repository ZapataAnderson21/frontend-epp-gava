import { Table } from "../../common/table";
import type { ElementType } from "../../data/types";

export default function ElementTable({ elements }: { elements: ElementType[] }) {
  const columns = [
    { key: "element_id", label: "Id", width: "w-16" },
    { key: "name", label: "Nombre", width: "w-36" },
    { key: "type", label: "Tipo", width: "w-36" },
    { key: "description", label: "Descripción", width: "w-144" }
  ] as const;

  return (
    <Table<ElementType>
      data={elements}
      columns={columns}
      getHref={(p) => `/admin/elements/${p.element_id}`}
    />
  );
}
