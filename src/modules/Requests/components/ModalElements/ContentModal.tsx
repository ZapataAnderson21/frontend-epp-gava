import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import BlueButton from "../../../../components/BlueButton";
import { type ElementType, type ElementRequestType } from "../../../../data/types";
import HeaderModal from "./HeaderModal";
import { FaDeleteLeft } from "react-icons/fa6";
import LoadingSkeletonTable from "../../../../common/loading/LoadingSkeletonTable";
import { useFetch } from "../../../../hooks/useFetch";
import { useApiAction } from "../../../../hooks/useApiAction";
import { elementApi, elementRequestApi } from "../../../../data/apiUrl";

interface ContentModalProps {
  typeElement: string;
  onSelected: (els: ElementType[], reqs: ElementRequestType[]) => void;
  onClose: () => void;
}

export default function ContentModal({ typeElement, onSelected, onClose }: ContentModalProps) {
  const [elements, setElements] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [originalIds, setOriginalIds] = useState<number[]>([]);
  const [searchItem, setSearchItem] = useState("");
  const [pages, setPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentElements = elements
    .filter((item) => item.name?.toLowerCase().includes(searchItem.toLowerCase()))
    .slice(indexOfFirstItem, indexOfLastItem);

  const { id } = useParams();
  const location = useLocation();
  const isNewRequest = location.pathname.endsWith("/new");

  // ✅ Hooks para API
  const { data: fetchedElements, loading, error } = useFetch<ElementType[]>(`${elementApi}type/${typeElement}`, [typeElement]);
  const { data: fetchedElementRequests } = useFetch<ElementRequestType[]>(id ? `${elementRequestApi}request/${id}` : "", [id]);

  const { execute: createElementRequest } = useApiAction<any>();
  const { execute: deleteElementRequest } = useApiAction<any>();

  // ✅ Cargar elementos
  useEffect(() => {
    if (fetchedElements) {
      setElements(fetchedElements);
      setPages(Math.ceil(fetchedElements.length / itemsPerPage));
    }
  }, [fetchedElements]);

  // ✅ Cargar selección inicial
  useEffect(() => {
    if (isNewRequest) {
      const saved = localStorage.getItem("selectedElements");
      if (saved) {
        const parsed: ElementType[] = JSON.parse(saved);
        setSelectedIds(
          parsed.map((item) => item.elementId).filter((id): id is number => id !== undefined)
        );
      }
    } else if (fetchedElementRequests) {
      const ids = fetchedElementRequests.map((er) => er.elementId);
      setSelectedIds(ids);
      setOriginalIds(ids);
    }
  }, [isNewRequest, fetchedElementRequests]);

  // ✅ Checkbox
  const handleCheckboxChange = (id?: number) => {
    if (id === undefined) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ✅ Guardar selección
  const onClick = async () => {
    if (isNewRequest) {
      // construir arrays actualizados
      const selectedElements = elements.filter(
        (item) => item.elementId !== undefined && selectedIds.includes(item.elementId!)
      );

      const prevSelected = localStorage.getItem("selectedElementRequest");
      let combined: any[] = [];

      if (prevSelected) {
        const parsed: any[] = JSON.parse(prevSelected);
        // elimina los que pertenecen a este tipo, para no duplicar
        const filtered = parsed.filter(
          (item) => !elements.some((e) => e.elementId === item.elementId)
        );
        combined = [...filtered];
      }

      const selectedElementRequest = selectedElements.map((item) => ({
        unit: "",
        quantityRequested: 0,               // ⚠️ usa tu nombre de campo real
        requestId: 0,
        elementId: item.elementId as number,
        element: item,
      }));

      const updatedReqs = [...combined, ...selectedElementRequest] as ElementRequestType[];
      const updatedEls = updatedReqs.map(r => r.element).filter((el): el is ElementType => el !== undefined);

      // ✅ actualiza estado arriba SIN recargar
      onSelected(updatedEls, updatedReqs);

      // opcional: cerrar modal
      onClose();
      return;
    }

    // --------- Caso edición (hay id) ----------
    if (id) {
      const requestId = Number(id);
      const added = selectedIds.filter((sid) => !originalIds.includes(sid));
      const removed = originalIds.filter((oid) => !selectedIds.includes(oid));

      for (const addId of added) {
        await createElementRequest(`${elementRequestApi}`, "POST", {
          elementId: addId,
          quantity_requested: 0,
          unit: " ",
          requestId,
        });
      }
      if (fetchedElementRequests) {
        for (const removeId of removed) {
          const itemToDelete = fetchedElementRequests.find((e) => e.elementId === removeId);
          if (itemToDelete?.elementRequestId !== undefined) {
            await deleteElementRequest(`${elementRequestApi}/${itemToDelete.elementRequestId}`, "DELETE");
          }
        }
      }

      // ✅ si quieres reflejar el cambio en pantalla sin reload:
      const nextOriginal = selectedIds;
      setOriginalIds(nextOriginal);

      // (opcional) si este modal también debe reflejarse en una vista padre en modo edición,
      // expón otro callback onAfterPersist() y llámalo aquí.

      onClose();
    }
  };

  if (loading) return <LoadingSkeletonTable />;
  if (error)
    return (
      <div className="flex items-center justify-center w-full h-full">
        {error}
      </div>
    );

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
          <div key={item.elementId ?? item.name} className="flex items-center justify-between w-full">
            <span className="flex items-center justify-start w-12">{item.elementId}</span>
            <span className="flex items-center justify-start w-full">{item.name}</span>
            <input
              type="checkbox"
              className="p-2 size-4"
              checked={item.elementId !== undefined && selectedIds.includes(item.elementId)}
              onChange={() => handleCheckboxChange(item.elementId)}
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
