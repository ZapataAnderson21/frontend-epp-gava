import { useState } from "react";
import ModalElements from "./ModalElements";
import SelectCard from "../SelectCard";
import type { ElementRequestType, ElementType } from "../../../../data/types";
import type { InventoryFamilyTabKey } from "../../../Elements/inventoryCatalog";

interface RequestTypeCardProps {
  icon: React.ReactNode;
  title: string;
  familyKey: InventoryFamilyTabKey;
  onSelected: (els: ElementType[], reqs: ElementRequestType[]) => void;
}

export default function RequestTypeCard({ icon, title, familyKey, onSelected }: RequestTypeCardProps) {

  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <SelectCard icon={icon} title={title} onClick={handleClick} />
      <ModalElements familyKey={familyKey} isOpen={isOpen} onClose={handleClose} onSelected={onSelected} />
    </>
  );
}
