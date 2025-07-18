import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BlueButton from "../../../../BlueButton";
import { type Element } from "../../../../Types";
import { fetchGetByType } from "../../../../data/elementData";
import {
  fetchCreateElementRequest,
  fetchDeleteElementRequest,
  fetchGetElementRequestsByRequest
} from "../../../../data/elementRequestData";
import HeaderModal from "./HeaderModal";
import { FaDeleteLeft } from "react-icons/fa6";

interface ContentModalProps {
  typeElement: string;
}

export default function ContentModal({ typeElement }: ContentModalProps) {
  const [elements, setElements] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [originalIds, setOriginalIds] = useState<number[]>([]);
  const [searchItem, setSearchItem] = useState("");
  const filteredElements = elements.filter((item) =>
    item.name?.toLowerCase().includes(searchItem.toLowerCase())
  );

  const [pages, setPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentElements = filteredElements.slice(indexOfFirstItem, indexOfLastItem);

  const { id } = useParams();
  const location = useLocation();

  const isNewRequest = location.pathname.endsWith("/new");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchElements = async () => {
      const response = await fetchGetByType(typeElement);
      if (response.statusCode === 200) {
        setElements(response.data);
        setPages(Math.ceil(response.data.length / itemsPerPage));
      }
    };

    fetchElements();
  }, [typeElement]);

  useEffect(() => {
    if (isNewRequest) {
      const saved = localStorage.getItem("selectedElements");
      if (saved) {
        const parsed: Element[] = JSON.parse(saved);
        setSelectedIds(
          parsed
            .map((item) => item.element_id)
            .filter((id): id is number => id !== undefined)
        );
      }
    } else if (id) {
      const fetchExisting = async () => {
        const res = await fetchGetElementRequestsByRequest(Number(id));
        if (res.statusCode === 200) {
          const ids = res.data.map((er) => er.element_id);
          setSelectedIds(ids);
          setOriginalIds(ids);
        }
      };
      fetchExisting();
    }
  }, [id, isNewRequest]);

  const handleCheckboxChange = (id?: number) => {
    if (id === undefined) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onClick = async () => {
    if (isNewRequest) {
      const selectedElements = elements.filter(
        (item) => item.element_id !== undefined && selectedIds.includes(item.element_id)
      );

      const prevSelected = localStorage.getItem("selectedElementRequest");
      let combined: any[] = [];

      if (prevSelected) {
        const parsed: any[] = JSON.parse(prevSelected);
        const filtered = parsed.filter(
          (item) => !elements.some((e) => e.element_id === item.element_id)
        );
        combined = [...filtered];
      }

      const selectedElementRequest = selectedElements.map((item) => ({
        unit: " ",
        quantity: 0,
        request_id: 0,
        element_id: item.element_id as number,
        element: item
      }));

      const updated = [...combined, ...selectedElementRequest];

      localStorage.setItem("selectedElements", JSON.stringify(updated.map(e => e.element)));
      localStorage.setItem("selectedElementRequest", JSON.stringify(updated));
      navigate(0);
    } else if (id) {
      const requestId = Number(id);
      const added = selectedIds.filter((sid) => !originalIds.includes(sid));
      const removed = originalIds.filter((oid) => !selectedIds.includes(oid));

      for (const addId of added) {
        await fetchCreateElementRequest({
          element_id: addId,
          quantity_requested: 0,
          unit: " ",
          request_id: requestId
        });
      }

      for (const removeId of removed) {
        const res = await fetchGetElementRequestsByRequest(requestId);
        const itemToDelete = res.data.find((e) => e.element_id === removeId);
        if (itemToDelete) {
          await fetchDeleteElementRequest(itemToDelete.element_request_id);
        }
      }

      navigate(0);
    }
  };

  return (
    <>
      <div className="px-3">
        <div className="flex flex-row items-center justify-between border border-gray-300 rounded-md px-2 py-1 w-full">
          <input
            type="text"
            className="outline-none size-full p-1"
            placeholder="Buscar por nombre..."
            value={searchItem}
            onChange={(e) => setSearchItem(e.target.value)}
          />
          <FaDeleteLeft
            className="size-6 hover:scale-110 cursor-pointer"
            onClick={() => setSearchItem("")}
          />
        </div>
      </div>
      <HeaderModal />
      <div className="flex flex-col items-center justify-between w-full pt-4 px-6 gap-4 text-[14px] md:text-[16px]">
      {currentElements.map((item) => (
        <div key={item.element_id ?? item.name} className="flex items-center justify-between w-full">
          <span className="flex items-center justify-start w-12">{item.element_id}</span>
          <span className="flex items-center justify-start w-full">{item.name}</span>
          <input
            type="checkbox"
            className="p-2 size-4"
            checked={item.element_id !== undefined && selectedIds.includes(item.element_id)}
            onChange={() => handleCheckboxChange(item.element_id)}
          />
        </div>
      ))}
      <div className="flex flex-row justify-end w-full font-bold mt-4 gap-2">
        {Array.from({ length: pages }, (_, i) => (
          <div
            key={i}
            className={`flex items-center px-3 py-2 border-2 rounded-md hover:bg-gray-100 cursor-pointer ${currentPage === i + 1 ? "bg-gray-300" : ""}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <BlueButton href="#" name="Guardar" onClick={onClick} />
    </div>
    </>
  );
}
