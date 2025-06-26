import RowTable from "./RowTable";
import { fetchGetAllElements, fetchGetByType, type ElementType } from "../../../data/elementData";
import { useEffect, useState } from "react";

interface ContentTableProps {
  type: string;
}

export default function ContentTable({ type }: ContentTableProps) {

  const [elements, setElements] = useState<ElementType[]>([]);

  useEffect(() => {
    const fetchElements = async () => {
      let response;
      if (type === "all") {
        response = await fetchGetAllElements();
      } else {
        response = await fetchGetByType(type);
      }

      if (response.statusCode === 200) {
        setElements(response.data);
      }
    };

    fetchElements();
  }, [type]);

  return (
    <div className="flex flex-col items-center justify-between w-full px-2 text-[13px] md:text-[14px]">
      {elements.map((element) => (
        <RowTable key={element.element_id} id={element.element_id} name={element.name} type={element.type} description={element.description} />
      ))}
    </div>
  );
}