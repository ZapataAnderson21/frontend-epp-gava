import RowTable from "./RowTable";
import { fetchGetAllElements, fetchGetByType, type ElementType } from "../../../data/elementData";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

interface ContentTableProps {
  type: string;
}

export default function ContentTable({ type }: ContentTableProps) {

  const [elements, setElements] = useState<ElementType[]>([]);
  const [pages, setPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const itemsPerPage = 8;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentElements = elements.slice(indexOfFirstItem, indexOfLastItem);

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
        setPages(Math.ceil(response.data.length / itemsPerPage));
      }
    };

    fetchElements();
  }, [type]);

  return (
    <>
      <div className="flex flex-col items-center justify-between w-full px-2 text-[13px] md:text-[14px]">
        {currentElements.map((element) => (
          <RowTable key={element.element_id} id={element.element_id} name={element.name} type={element.type} description={element.description} />
        ))}
      </div>
      <div className="flex flex-row justify-end w-full font-bold mt-4 gap-2">
        <div
          className="flex items-center px-3 py-2 border-2 rounded-md hover:bg-gray-100 cursor-pointer"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          <FaArrowLeft className="size-3" />
        </div>
        {Array.from({ length: pages }, (_, i) => (
          <div
            key={i}
            className={`flex items-center px-3 py-2 border-2 rounded-md hover:bg-gray-100 cursor-pointer ${currentPage === i + 1 ? "bg-gray-300" : ""}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </div>
        ))}
        <div
          className="flex items-center px-3 py-2 border-2 rounded-md hover:bg-gray-100 cursor-pointer"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pages))}
        >
          <FaArrowRight className="size-3" />
        </div>
      </div>
    </>
  );
}