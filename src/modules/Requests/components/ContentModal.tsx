import { useState, useEffect } from "react";
import BlueButton from "../../../BlueButton";
import { type Element } from "../../../Types";
import { fetchGetByType } from "../../../data/elementData";

interface ContentModalProps {
  typeElement: string;
}

export default function ContentModal({ typeElement }: ContentModalProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [elements, setElements] = useState<any[]>([]);

  useEffect(() => {
    const fetchElements = async () => {
      const response = await fetchGetByType(typeElement);
      if (response.statusCode === 200) {
        setElements(response.data);
      }
    };

    fetchElements();
  }, [typeElement]);

  const handleCheckboxChange = (id?: number) => {
    if (id === undefined) return;

    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const onClick = () => {
    const selectedElements = elements.filter(
      (item) => item.element_id !== undefined && selectedIds.includes(item.element_id)
    );

    // Leer los elementos previos del localStorage
    const prevSelected = localStorage.getItem("selectedElementRequest");
    let combined: any[] = [];

    if (prevSelected) {
      const parsed: any[] = JSON.parse(prevSelected);

      // Filtrar elementos de otros tipos distintos al actual
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

    // Combinar sin duplicar
    const updated = [...combined, ...selectedElementRequest];

    localStorage.setItem("selectedElements", JSON.stringify(updated.map(e => e.element)));
    localStorage.setItem("selectedElementRequest", JSON.stringify(updated));

    window.location.reload();
  };


  useEffect(() => {
    const saved = localStorage.getItem("selectedElements");
    if (saved) {
      const parsed: Element[] = JSON.parse(saved);
      setSelectedIds(
        parsed
          .map((item) => item.element_id)
          .filter((id): id is number => id !== undefined)
      );
    }
  }, []);

  

  return (
    <div className="flex flex-col items-center justify-between w-full pt-4 px-6 gap-4 text-[14px] md:text-[16px]">
      {elements.map((item) => (
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
      <BlueButton href="#" name="Guardar" onClick={onClick} />
    </div>
  );
}
