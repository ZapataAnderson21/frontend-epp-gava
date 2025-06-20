import { useState, useEffect } from "react";
import BlueButton from "../../../BlueButton";
import dataModal from "../../../ListOfElements";
import { type Element } from "../../../Types";

interface ContentModalProps {
  typeElement: string;
}

export default function ContentModal({ typeElement }: ContentModalProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleCheckboxChange = (id?: number) => {
    if (id === undefined) return;

    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const onClick = () => {
    const selectedElements = dataModal.filter(
      (item) => item.element_id !== undefined && selectedIds.includes(item.element_id)
    );

    localStorage.setItem("selectedElements", JSON.stringify(selectedElements));

    const selectedElementRequest = selectedElements.map((item) => ({
      unit: " ",
      quantity: 0,
      request_id: 0,
      element_id: item.element_id as number,
      element: item
    }));

    localStorage.setItem("selectedElementRequest", JSON.stringify(selectedElementRequest));

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
      {dataModal.map((item) => (
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
