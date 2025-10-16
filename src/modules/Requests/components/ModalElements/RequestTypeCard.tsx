import { useState } from "react";
import ModalElements from "./ModalElements";
import SelectCard from "../SelectCard";
import type { ElementRequestType, ElementType } from "../../../../data/types";

interface RequestTypeCardProps {
  icon: React.ReactNode;
  title: string;
  typeElement: string;
  onSelected: (els: ElementType[], reqs: ElementRequestType[]) => void;
}

export default function RequestTypeCard({ icon, title, typeElement, onSelected }: RequestTypeCardProps) {

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
      <ModalElements typeElement={typeElement} isOpen={isOpen} onClose={handleClose} onSelected={onSelected} />
    </>
  );
}
