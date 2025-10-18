import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { elementApi } from "../../data/apiUrl";
import type { ElementType } from "../../data/types";
import { useFetch } from "../../hooks";
import { EditButton } from "../../common/button";

interface ElementTableProps {
  filter: string;
}

export default function ElementTable({ filter }: ElementTableProps) {

  const { data: elements, loading, error } = useFetch<ElementType[]>(elementApi + (filter !== "all" ? `type/${filter}` : ""), [filter]);
  
  const navigate = useNavigate();

  const columns = [
    { key: "elementId", label: "Id", width: "4rem" },
    { key: "name", label: "Nombre", width: "16rem" },
    { key: "type", label: "Tipo", width: "9rem" },
    { key: "description", label: "Descripción", width: "36rem", truncate: true },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: ElementType) => {
        return <EditButton onClick={() => navigate(`/admin/elements/${row.elementId}`)} />;
      }
    }
  ] as const;

  if(loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!elements || elements.length === 0) {
    return <div className="text-gray-500">No hay elementos disponibles.</div>;
  }

  return (
    <Table<ElementType>
      data={elements}
      columns={columns}
    />
  );
}
