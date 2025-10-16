import type { ElementRequestType, ElementType } from "../../../../data/types";
import ModalSelect from "../ModalSelect";
import ContentModal from "./ContentModal";

interface ModalElementsProps {
  typeElement: string;
  isOpen?: boolean;
  onClose: () => void;
  onSelected: (els: ElementType[], reqs: ElementRequestType[]) => void;
}

export default function ModalElements({ typeElement, isOpen, onClose, onSelected }: ModalElementsProps) {

  if (!isOpen) return null;

  let title = "";

  switch (typeElement) {
    case "epp":
      title = "Elementos de Seguridad";
      break;
    case "operative":
      title = "Elementos Operativos";
      break;
    default:
      title = "Elementos";
  }

  return (
    <ModalSelect title={title} isOpen={isOpen} onClose={onClose}>
      <ContentModal typeElement={typeElement} onSelected={onSelected} onClose={onClose} />
    </ModalSelect>
  );
} 